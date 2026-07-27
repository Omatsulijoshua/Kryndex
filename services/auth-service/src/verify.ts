import * as argon2 from 'argon2';
import { authenticator } from 'otplib';

async function testCryptoInvariants() {
  console.log('--- STARTING CRYPTOGRAPHIC VERIFICATION CHECKS ---');

  // 1. Verify Argon2id Password Hashing
  const password = 'KryndexSecurePassword2026!';
  console.log('Testing password:', password);

  console.log('Hashing password with Argon2id parameters (16MB memory, 3 iterations, 4 parallelism)...');
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 16384,
    timeCost: 3,
    parallelism: 4,
  });
  console.log('Generated hash:', hash);

  if (!hash.startsWith('$argon2id$')) {
    console.error('FAIL: Hash is not argon2id format!');
    process.exit(1);
  }
  console.log('PASS: Argon2id signature validated.');

  console.log('Verifying correct password matches...');
  const match = await argon2.verify(hash, password);
  if (!match) {
    console.error('FAIL: Correct password verification failed!');
    process.exit(1);
  }
  console.log('PASS: Correct password verification succeeded.');

  console.log('Verifying incorrect password fails...');
  const failMatch = await argon2.verify(hash, 'wrongpassword');
  if (failMatch) {
    console.error('FAIL: Incorrect password verification succeeded!');
    process.exit(1);
  }
  console.log('PASS: Incorrect password rejected.');

  // 2. Verify TOTP 2FA Secret & Code Generation
  console.log('\nTesting MFA OTP authentication cycle...');
  const secret = authenticator.generateSecret();
  console.log('Generated secret key:', secret);

  const code = authenticator.generate(secret);
  console.log('Generated current code:', code);

  console.log('Verifying OTP code...');
  const otpValid = authenticator.verify({
    token: code,
    secret: secret,
  });

  if (!otpValid) {
    console.error('FAIL: Valid OTP code verification failed!');
    process.exit(1);
  }
  console.log('PASS: OTP verification succeeded.');

  console.log('Verifying expired/invalid OTP code fails...');
  const otpInvalid = authenticator.verify({
    token: '000000',
    secret: secret,
  });

  if (otpInvalid) {
    console.error('FAIL: Invalid OTP code verification succeeded!');
    process.exit(1);
  }
  console.log('PASS: Invalid OTP code rejected.');

  console.log('\n--- ALL CRYPTOGRAPHIC INVARIANT CHECKS PASSED ---');
}

testCryptoInvariants().catch((err) => {
  console.error('Test threw unhandled exception:', err);
  process.exit(1);
});
