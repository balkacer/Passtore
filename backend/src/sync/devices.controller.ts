import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

type AuthedRequest = Request & {
  user: { userId: string };
};

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly syncService: SyncService) {}

  @Post('register')
  register(@Req() req: AuthedRequest, @Body() dto: RegisterDeviceDto) {
    return this.syncService.registerDevice(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.syncService.listDevices(req.user.userId);
  }
}
