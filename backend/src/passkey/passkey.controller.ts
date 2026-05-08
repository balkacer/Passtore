import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { PasskeyService } from './passkey.service';
import {
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
} from './dto/passkey-login.dto';
import { PasskeyRegisterVerifyDto } from './dto/passkey-register.dto';

type AuthedRequest = Request & {
  user: { userId: string };
};

@Controller('auth/passkey')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register/options')
  registerOptions(@Req() req: AuthedRequest) {
    return this.passkeyService.registrationOptions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register/verify')
  async registerVerify(
    @Req() req: AuthedRequest,
    @Body() dto: PasskeyRegisterVerifyDto,
  ) {
    return this.passkeyService.registrationVerify(
      req.user.userId,
      dto.response as unknown as RegistrationResponseJSON,
    );
  }

  @Post('login/options')
  loginOptions(@Body() dto: PasskeyLoginOptionsDto) {
    return this.passkeyService.loginOptions(dto.username);
  }

  @Post('login/verify')
  loginVerify(@Body() dto: PasskeyLoginVerifyDto) {
    return this.passkeyService.loginVerify(
      dto.username,
      dto.response as unknown as AuthenticationResponseJSON,
    );
  }
}
