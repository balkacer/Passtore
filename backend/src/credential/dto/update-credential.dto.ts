import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCredentialDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  alias?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  platformName?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  loginUsername?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  encryptedPassword?: string;

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
