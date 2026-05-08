import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  username!: string;

  /** Account password (hashed server-side). Never send vault secrets here. */
  @IsString()
  @MinLength(8)
  password!: string;
}
