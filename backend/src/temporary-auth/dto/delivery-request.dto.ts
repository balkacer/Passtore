import { IsEnum, IsUUID, IsString, MaxLength, MinLength } from 'class-validator';
import { TemporaryCredentialRequestPurpose } from '../temporary-auth.enums';

export class DeliveryRequestDto {
  @IsUUID()
  credentialId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2048)
  requestedOrigin!: string;

  @IsEnum(TemporaryCredentialRequestPurpose)
  purpose!: TemporaryCredentialRequestPurpose;
}
