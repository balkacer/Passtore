import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ExtensionAutofillDto {
  @IsUUID()
  credentialId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2048)
  requestedOrigin!: string;
}
