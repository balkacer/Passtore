import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApprovePairingDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  pairingCode!: string;

  /** Client device public id (matches registered_devices.device_public_id). */
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  devicePublicId!: string;

  /** Optional client assertion that biometric ran (opaque string for future attestation). */
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  biometricAssertion?: string;
}
