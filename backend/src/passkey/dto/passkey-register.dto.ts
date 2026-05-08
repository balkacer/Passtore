import { IsObject } from 'class-validator';

export class PasskeyRegisterVerifyDto {
  @IsObject()
  response!: Record<string, unknown>;
}
