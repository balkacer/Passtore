import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class PasskeyLoginOptionsDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}

export class PasskeyLoginVerifyDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsObject()
  response!: Record<string, unknown>;
}
