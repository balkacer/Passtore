import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';
import { PushSyncEventDto } from './dto/push-sync-event.dto';

type AuthedRequest = Request & {
  user: { userId: string };
};

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncEventsController {
  constructor(private readonly syncService: SyncService) {}

  @Post('events')
  push(@Req() req: AuthedRequest, @Body() dto: PushSyncEventDto) {
    return this.syncService.pushEvent(req.user.userId, dto);
  }

  @Get('events')
  pull(
    @Req() req: AuthedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? parseInt(limitStr, 10)
        : undefined;
    return this.syncService.pullEvents(req.user.userId, cursor, limit);
  }
}
