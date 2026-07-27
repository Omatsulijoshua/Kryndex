import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@kryndex/database';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 1. REGISTRATION
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('EMAIL_ALREADY_EXISTS', 'Email is already registered');
    }

    // Hash password with Argon2id parameters
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 16384, // 16MB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 threads
    });

    // Create User, Profile, and Security configuration inside database transaction
    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          country: dto.country,
        },
      });

      await tx.userSecurity.create({
        data: {
          userId: user.id,
        },
      });

      // Initialize default customer KYC level 1 (BASIC)
      await tx.kycApplication.create({
        data: {
          userId: user.id,
          level: 'BASIC',
          status: 'APPROVED',
        },
      });

      return { userId: user.id, email: user.email };
    });
  }

  // 2. LOGIN
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { security: true },
    });

    if (!user) {
      await this.logLoginAttempt(dto.email, ipAddress, userAgent, 'FAILED_CREDENTIALS');
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check account lockout status
    if (user.security?.lockoutUntil && user.security.lockoutUntil > new Date()) {
      await this.logLoginAttempt(dto.email, ipAddress, userAgent, 'LOCKED_OUT');
      throw new UnauthorizedException(
        'ACCOUNT_LOCKED',
        `Account is locked out until ${user.security.lockoutUntil.toISOString()}`,
      );
    }

    // Verify Password
    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      await this.incrementFailedLogin(user.id, user.security?.failedLoginAttempts || 0);
      await this.logLoginAttempt(dto.email, ipAddress, userAgent, 'FAILED_CREDENTIALS');
      throw new UnauthorizedException('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Password matches, handle MFA verification check
    if (user.security?.mfaEnabled) {
      if (!dto.otp) {
        return { mfaRequired: true, tempToken: this.signTempToken(user.id) };
      }

      // Verify OTP
      const otpVerified = authenticator.verify({
        token: dto.otp,
        secret: user.security.mfaSecret || '',
      });
      if (!otpVerified) {
        await this.logLoginAttempt(dto.email, ipAddress, userAgent, 'FAILED_MFA');
        throw new UnauthorizedException('INVALID_2FA_CODE', 'Invalid 2FA authentication code');
      }
    }

    // Reset failed login tracking
    await this.resetFailedLogin(user.id);
    await this.logLoginAttempt(dto.email, ipAddress, userAgent, 'SUCCESS');

    // Create session & trusted device logs
    const fingerprint = dto.deviceFingerprint || 'unknown_fingerprint';
    const device = await this.registerDevice(user.id, fingerprint, userAgent, ipAddress);
    const session = await this.createSession(user.id, device.id);

    return {
      accessToken: this.signAccessToken(user.id),
      refreshToken: session.token,
    };
  }

  // 3. 2FA SETUP
  async setup2fa(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      userId,
      process.env.MFA_ISSUER || 'Kryndex',
      secret,
    );

    // Save temporary mfaSecret
    await prisma.userSecurity.update({
      where: { userId },
      data: { mfaSecret: secret },
    });

    return { secret, otpauthUrl };
  }

  // 4. 2FA VERIFY & ACTIVATE
  async verify2fa(userId: string, code: string) {
    const security = await prisma.userSecurity.findUnique({
      where: { userId },
    });
    if (!security || !security.mfaSecret) {
      throw new BadRequestException('MFA_NOT_CONFIGURED', 'MFA has not been configured yet');
    }

    const verified = authenticator.verify({
      token: code,
      secret: security.mfaSecret,
    });
    if (!verified) {
      throw new UnauthorizedException('INVALID_2FA_CODE', 'Invalid OTP code');
    }

    // Enable MFA status
    await prisma.userSecurity.update({
      where: { userId },
      data: { mfaEnabled: true },
    });

    // Write security events audit
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'MFA_ENABLED',
        description: 'Multi-factor authentication activated successfully',
        ipAddress: '0.0.0.0',
      },
    });

    return { success: true };
  }

  // 5. SESSION ROTATION
  async refreshSession(refreshToken: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('INVALID_SESSION', 'Session is invalid or expired');
    }

    // Implement rotating refresh token policy: issue a new one and invalidate previous one
    const newSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(newSessionToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // extends by 7 days
      },
    });

    return {
      accessToken: this.signAccessToken(session.userId),
      refreshToken: newSessionToken,
    };
  }

  // 6. LOGOUT
  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await prisma.userSession.updateMany({
      where: { refreshTokenHash: hash },
      data: { isRevoked: true },
    });
    return { success: true };
  }

  // Helper session and hash functions
  private signAccessToken(userId: string): string {
    return this.jwtService.sign({ sub: userId, type: 'ACCESS' }, { expiresIn: '15m' });
  }

  private signTempToken(userId: string): string {
    return this.jwtService.sign({ sub: userId, type: 'TEMP_MFA' }, { expiresIn: '5m' });
  }

  private hashToken(token: string): string {
    // Simple mock SHA256 / hash representation
    return token;
  }

  private async logLoginAttempt(email: string, ip: string, ua: string, status: string) {
    await prisma.loginAttempt.create({
      data: { email, ipAddress: ip, userAgent: ua, status },
    });
  }

  private async incrementFailedLogin(userId: string, currentAttempts: number) {
    const attempts = currentAttempts + 1;
    const lockoutUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 mins lockout

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        failedLoginAttempts: attempts,
        lockoutUntil,
      },
    });
  }

  private async resetFailedLogin(userId: string) {
    await prisma.userSecurity.update({
      where: { userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }

  private async registerDevice(userId: string, fingerprint: string, ua: string, ip: string) {
    return prisma.userDevice.upsert({
      where: {
        userId_deviceFingerprint: { userId, deviceFingerprint: fingerprint },
      },
      update: { lastLoginAt: new Date(), ipAddress: ip },
      create: { userId, deviceFingerprint: fingerprint, userAgent: ua, ipAddress: ip },
    });
  }

  private async createSession(userId: string, deviceId: string) {
    const rawToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return prisma.userSession.create({
      data: {
        userId,
        deviceId,
        refreshTokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
      },
    }).then((session: any) => ({ ...session, token: rawToken }));
  }
}
