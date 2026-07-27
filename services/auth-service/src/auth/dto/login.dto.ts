import { IsEmail, IsString, IsOptional, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp?: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
