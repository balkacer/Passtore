import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemporaryAuthSession } from './temporary-auth-session.entity';
import {
  TemporaryAuthSessionStatus,
} from './temporary-auth.enums';

type TemporaryJwtPayload = {
  typ?: string;
  sid?: string;
  sub?: string;
};

@Injectable()
export class TemporaryJwtStrategy extends PassportStrategy(Strategy, 'temporary-jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(TemporaryAuthSession)
    private readonly sessions: Repository<TemporaryAuthSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  async validate(payload: TemporaryJwtPayload) {
    if (payload.typ !== 'temporary_session' || !payload.sid || !payload.sub) {
      throw new UnauthorizedException();
    }
    const session = await this.sessions.findOne({
      where: { id: payload.sid, userId: payload.sub },
    });
    if (!session || session.status !== TemporaryAuthSessionStatus.ACTIVE) {
      throw new UnauthorizedException();
    }
    if (session.expiresAt < new Date()) {
      session.status = TemporaryAuthSessionStatus.EXPIRED;
      await this.sessions.save(session);
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, tempSession: session };
  }
}
