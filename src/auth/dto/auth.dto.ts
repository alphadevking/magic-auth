import { IsEmail, IsString, IsOptional } from 'class-validator'; // Import IsOptional

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
}
