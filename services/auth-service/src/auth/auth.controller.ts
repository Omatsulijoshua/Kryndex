import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') ua: string = 'unknown_client',
  ) {
    const ip = req.ip || '127.0.0.1';
    return this.authService.login(dto, ip, ua);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshSession(token);
  }

  @Post('logout')
  async logout(@Body('refreshToken') token: string) {
    return this.authService.logout(token);
  }

  @Post('2fa/setup')
  async setup2fa(@Body('userId') userId: string) {
    return this.authService.setup2fa(userId);
  }

  @Post('2fa/verify')
  async verify2fa(@Body('userId') userId: string, @Body('code') code: string) {
    return this.authService.verify2fa(userId, code);
  }
}
