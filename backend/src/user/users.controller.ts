import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

type AuthedRequest = Request & {
  user: { userId: string; email: string; username: string };
};

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  profile(@Req() req: AuthedRequest) {
    return {
      id: req.user.userId,
      email: req.user.email,
      username: req.user.username,
    };
  }
}
