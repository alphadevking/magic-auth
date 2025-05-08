import { IsString, IsOptional, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  // destination can be email or phone number, so use IsString
  @IsString()
  destination: string;

  // name is optional
  @IsOptional()
  @IsString()
  name?: string; // Use optional property syntax
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  otpUserSecret?: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}
