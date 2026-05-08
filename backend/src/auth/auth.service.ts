import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { User } from '../user/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
    const accessToken = await this.signToken(user.id, user.email);
    return {
      accessToken,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.signToken(user.id, user.email);
    return {
      accessToken,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.signAsync({ sub: userId, email });
  }

  /** Used after WebAuthn / passkey verification */
  async createSessionForUser(user: User) {
    const accessToken = await this.signToken(user.id, user.email);
    return {
      accessToken,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}
