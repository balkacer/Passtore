import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemporaryJwtAuthGuard } from './temporary-jwt-auth.guard';
import { TemporaryAuthService } from './temporary-auth.service';
import { InitPairingDto } from './dto/init-pairing.dto';
import { ApprovePairingDto } from './dto/approve-pairing.dto';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { ExtensionAutofillDto } from './dto/extension-autofill.dto';
import { TemporaryAuthSession } from './temporary-auth-session.entity';

type AuthedUser = { userId: string };
type TempAuthedUser = { userId: string; tempSession: TemporaryAuthSession };

@Controller('temporary-auth')
export class TemporaryAuthController {
  constructor(private readonly service: TemporaryAuthService) {}

  @Post('pairing/init')
  initPairing(@Body() dto: InitPairingDto) {
    return this.service.initPairing(dto);
  }

  @Get('pairing/:sessionId/status')
  pollPairing(
    @Param('sessionId') sessionId: string,
    @Headers('x-pairing-code') headerCode: string | undefined,
    @Query('code') queryCode: string | undefined,
  ) {
    const code = headerCode ?? queryCode;
    if (!code?.trim()) {
      throw new BadRequestException(
        'Pairing code required (header X-Pairing-Code or query code)',
      );
    }
    return this.service.pollPairing(sessionId, code.trim());
  }

  @Post('pairing/:sessionId/approve')
  @UseGuards(JwtAuthGuard)
  approvePairing(
    @Req() req: { user: AuthedUser },
    @Param('sessionId') sessionId: string,
    @Body() dto: ApprovePairingDto,
  ) {
    return this.service.approvePairing(req.user.userId, sessionId, dto);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(@Req() req: { user: AuthedUser }) {
    return this.service.listSessions(req.user.userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  revokeSession(
    @Req() req: { user: AuthedUser },
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.revokeSession(req.user.userId, sessionId);
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  revokeAll(@Req() req: { user: AuthedUser }) {
    return this.service.revokeAllSessions(req.user.userId);
  }

  @Get('sessions/:sessionId/audit')
  @UseGuards(JwtAuthGuard)
  listAudit(
    @Req() req: { user: AuthedUser },
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.listAudit(sessionId, req.user.userId);
  }

  @Post('extension-autofill')
  @UseGuards(JwtAuthGuard)
  extensionAutofill(
    @Req() req: { user: AuthedUser },
    @Body() dto: ExtensionAutofillDto,
  ) {
    return this.service.extensionAutofillDeliver(req.user.userId, dto);
  }

  @Post('deliver')
  @UseGuards(TemporaryJwtAuthGuard)
  deliver(@Req() req: { user: TempAuthedUser }, @Body() dto: DeliveryRequestDto) {
    return this.service.requestDelivery(req.user.tempSession, req.user.userId, dto);
  }

  @Post('deliveries/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  approvePendingDelivery(
    @Req() req: { user: AuthedUser },
    @Param('requestId') requestId: string,
  ) {
    return this.service.approvePendingDelivery(req.user.userId, requestId);
  }

  @Get('deliveries/:requestId/poll')
  @UseGuards(TemporaryJwtAuthGuard)
  pollDelivery(
    @Req() req: { user: TempAuthedUser },
    @Param('requestId') requestId: string,
  ) {
    return this.service.pollDelivery(req.user.tempSession, req.user.userId, requestId);
  }
}
