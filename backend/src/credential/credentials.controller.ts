import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

type AuthedRequest = Request & {
  user: { userId: string };
};

@Controller('credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateCredentialDto) {
    return this.credentialsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthedRequest) {
    return this.credentialsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.credentialsService.findOneForUser(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCredentialDto,
  ) {
    return this.credentialsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    await this.credentialsService.remove(id, req.user.userId);
    return { ok: true };
  }
}
