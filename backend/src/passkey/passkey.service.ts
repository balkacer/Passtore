import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { ConfigService } from '@nestjs/config';
import { PasskeyCredential } from './passkey-credential.entity';
import { UsersService } from '../user/users.service';
import { AuthService } from '../auth/auth.service';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PasskeyService {
  private regChallenges = new Map<
    string,
    { challenge: string; expiresAt: number }
  >();
  private authChallenges = new Map<
    string,
    { challenge: string; expiresAt: number }
  >();

  constructor(
    @InjectRepository(PasskeyCredential)
    private readonly passkeyRepo: Repository<PasskeyCredential>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get rpId(): string {
    return this.config.get<string>('WEBAUTHN_RP_ID') ?? 'localhost';
  }

  private get rpName(): string {
    return this.config.get<string>('WEBAUTHN_RP_NAME') ?? 'Passtore';
  }

  private get origins(): string[] {
    const raw =
      this.config.get<string>('WEBAUTHN_ORIGINS') ??
      'http://localhost:5173,http://localhost:3000,http://localhost,http://127.0.0.1:5173';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  private prune(map: Map<string, { challenge: string; expiresAt: number }>) {
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (v.expiresAt < now) {
        map.delete(k);
      }
    }
  }

  async registrationOptions(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const existing = await this.passkeyRepo.find({ where: { userId } });
    const opts = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName: user.username,
      userDisplayName: user.username,
      userID: isoUint8Array.fromUTF8String(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((p) => ({
        id: p.credentialId,
        transports: (p.transports ?? undefined) as never,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    this.prune(this.regChallenges);
    this.regChallenges.set(userId, {
      challenge: opts.challenge,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return opts;
  }

  async registrationVerify(
    userId: string,
    response: RegistrationResponseJSON,
  ): Promise<{ ok: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const stored = this.regChallenges.get(userId);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('Registration challenge expired');
    }
    const expectedChallenge = stored.challenge;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origins,
        expectedRPID: this.rpId,
        requireUserVerification: false,
      });
    } catch {
      throw new BadRequestException('Passkey registration verification failed');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Passkey registration not verified');
    }

    const { credential } = verification.registrationInfo;
    const row = this.passkeyRepo.create({
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: String(credential.counter),
      transports: credential.transports ? [...credential.transports] : null,
    });
    await this.passkeyRepo.save(row);
    this.regChallenges.delete(userId);
    return { ok: true };
  }

  async loginOptions(username: string) {
    const user = await this.usersService.findByUsername(username.trim());
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }
    const creds = await this.passkeyRepo.find({ where: { userId: user.id } });
    if (creds.length === 0) {
      throw new BadRequestException(
        'No passkeys registered for this user. Sign in with password once and register a passkey from Home.',
      );
    }

    const opts = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        transports: (c.transports ?? undefined) as never,
      })),
      userVerification: 'preferred',
    });

    this.prune(this.authChallenges);
    const key = username.trim().toLowerCase();
    this.authChallenges.set(key, {
      challenge: opts.challenge,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return opts;
  }

  async loginVerify(
    username: string,
    response: AuthenticationResponseJSON,
  ): Promise<{ accessToken: string; user: { id: string; email: string; username: string } }> {
    const user = await this.usersService.findByUsername(username.trim());
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    const key = username.trim().toLowerCase();
    const stored = this.authChallenges.get(key);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('Authentication challenge expired');
    }

    const credId = response.id;
    const row = await this.passkeyRepo.findOne({
      where: { credentialId: credId, userId: user.id },
    });
    if (!row) {
      throw new UnauthorizedException('Unknown credential');
    }

    const credential: WebAuthnCredential = {
      id: row.credentialId,
      publicKey: new Uint8Array(row.publicKey),
      counter: Number(row.counter),
      transports: (row.transports ?? undefined) as WebAuthnCredential['transports'],
    };

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: this.origins,
        expectedRPID: this.rpId,
        credential,
        requireUserVerification: false,
      });
    } catch {
      throw new UnauthorizedException('Passkey verification failed');
    }

    if (!verification.verified) {
      throw new UnauthorizedException('Passkey not verified');
    }

    row.counter = String(verification.authenticationInfo.newCounter);
    await this.passkeyRepo.save(row);
    this.authChallenges.delete(key);

    return this.authService.createSessionForUser(user);
  }
}
