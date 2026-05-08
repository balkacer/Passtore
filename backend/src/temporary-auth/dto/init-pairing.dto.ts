import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TemporaryAuthContextType } from '../temporary-auth.enums';

export class InitPairingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  requestingDeviceName!: string;

  @IsEnum(TemporaryAuthContextType)
  contextType!: TemporaryAuthContextType;

  /** Origin or host the temporary client will operate on (e.g. https://bank.com). */
  @IsString()
  @MinLength(3)
  @MaxLength(2048)
  allowedOrigin!: string;

  /** Optional permission overrides (defaults applied server-side). */
  @IsOptional()
  permissions?: Record<string, unknown>;
}
