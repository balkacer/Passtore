import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  @MinLength(1)
  alias!: string;

  @IsString()
  @MinLength(1)
  platformName!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsString()
  @MinLength(1)
  loginUsername!: string;

  /** Client-encrypted payload; server stores without decrypting. */
  @IsString()
  @MinLength(1)
  encryptedPassword!: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  notesEncrypted?: string;

  @IsOptional()
  @IsInt()
  strengthScore?: number;

  @IsOptional()
  @IsBoolean()
  isDuplicate?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}
