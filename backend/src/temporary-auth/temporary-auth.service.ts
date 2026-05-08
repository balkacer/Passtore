import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CredentialsService } from '../credential/credentials.service';
import { RegisteredDevice } from '../sync/registered-device.entity';
import { TemporaryAuthAudit } from './temporary-auth-audit.entity';
import {
  TemporaryAuthAuditActor,
  TemporaryAuthSessionStatus,
  TemporaryCredentialRequestPurpose,
  TemporaryCredentialRequestStatus,
} from './temporary-auth.enums';
import { TemporaryAuthSession, TemporarySessionPermissions } from './temporary-auth-session.entity';
import { TemporaryCredentialRequest } from './temporary-credential-request.entity';
import { ApprovePairingDto } from './dto/approve-pairing.dto';
import { InitPairingDto } from './dto/init-pairing.dto';
import { DeliveryRequestDto } from './dto/delivery-request.dto';

const PAIRING_TTL_MS_DEFAULT = 10 * 60 * 1000;
const SESSION_TTL_MS_DEFAULT = 60 * 60 * 1000;
const REQUEST_TTL_MS_DEFAULT = 5 * 60 * 1000;

export interface TemporaryJwtPayload {
  typ: 'temporary_session';
  sid: string;
  sub: string;
}

@Injectable()
export class TemporaryAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(TemporaryAuthSession)
    private readonly sessions: Repository<TemporaryAuthSession>,
    @InjectRepository(TemporaryCredentialRequest)
    private readonly deliveries: Repository<TemporaryCredentialRequest>,
    @InjectRepository(TemporaryAuthAudit)
    private readonly audit: Repository<TemporaryAuthAudit>,
    @InjectRepository(RegisteredDevice)
    private readonly devices: Repository<RegisteredDevice>,
    private readonly credentialsService: CredentialsService,
  ) {}

  private pepper(): string {
    return this.config.get<string>('TEMPORARY_PAIRING_PEPPER') ?? 'change-me-pepper';
  }

  private pairingTtlMs(): number {
    return parseInt(
      this.config.get<string>('TEMPORARY_PAIRING_TTL_MS') ?? '',
      10,
    ) || PAIRING_TTL_MS_DEFAULT;
  }

  private sessionTtlMs(): number {
    return parseInt(
      this.config.get<string>('TEMPORARY_SESSION_TTL_MS') ?? '',
      10,
    ) || SESSION_TTL_MS_DEFAULT;
  }

  private requestTtlMs(): number {
    return parseInt(
      this.config.get<string>('TEMPORARY_REQUEST_TTL_MS') ?? '',
      10,
    ) || REQUEST_TTL_MS_DEFAULT;
  }

  hashPairingCode(plain: string): string {
    return createHash('sha256')
      .update(`${this.pepper()}|${plain}`)
      .digest('hex');
  }

  generatePairingCode(): string {
    return randomBytes(10).toString('base64url').slice(0, 16);
  }

  normalizeOrigin(input: string): string {
    const t = input.trim();
    try {
      const u = new URL(t.includes('://') ? t : `https://${t}`);
      return u.origin;
    } catch {
      throw new BadRequestException('Invalid allowedOrigin');
    }
  }

  private hostKey(originOrUrl: string): string {
    try {
      const u = new URL(
        originOrUrl.includes('://') ? originOrUrl : `https://${originOrUrl}`,
      );
      return u.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  originsCompatible(sessionOrigin: string, requested: string): boolean {
    const a = this.hostKey(sessionOrigin);
    const b = this.hostKey(requested);
    if (!a || !b) {
      return false;
    }
    return (
      a === b ||
      a.endsWith(`.${b}`) ||
      b.endsWith(`.${a}`)
    );
  }

  defaultPermissions(
    partial?: Record<string, unknown>,
  ): TemporarySessionPermissions {
    const base: TemporarySessionPermissions = {
      allowAutofill: true,
      allowCopy: true,
      allowReveal: false,
      requireBiometricPerSensitiveRequest: true,
      maxDeliveries: 100,
    };
    if (!partial || typeof partial !== 'object') {
      return base;
    }
    return { ...base, ...partial } as TemporarySessionPermissions;
  }

  async initPairing(dto: InitPairingDto) {
    const plainCode = this.generatePairingCode();
    const now = new Date();
    const pairingExpiresAt = new Date(now.getTime() + this.pairingTtlMs());
    const allowedOrigin = this.normalizeOrigin(dto.allowedOrigin);
    const session = this.sessions.create({
      userId: null,
      approvedByDeviceId: null,
      requestingDeviceName: dto.requestingDeviceName,
      contextType: dto.contextType,
      allowedOrigin,
      permissions: this.defaultPermissions(dto.permissions),
      expiresAt: pairingExpiresAt,
      status: TemporaryAuthSessionStatus.PENDING_PAIRING,
      pairingCodeHash: this.hashPairingCode(plainCode),
      pairingExpiresAt,
      deliveryCount: 0,
    });
    const saved = await this.sessions.save(session);
    await this.logAudit(saved.id, 'pairing_init', TemporaryAuthAuditActor.REQUESTING_CLIENT, null, {
      contextType: dto.contextType,
      allowedOrigin,
    });
    const deepLink = `passtore://temp-auth/pairing?sid=${encodeURIComponent(saved.id)}&code=${encodeURIComponent(plainCode)}`;
    return {
      sessionId: saved.id,
      pairingCode: plainCode,
      pairingExpiresAt: pairingExpiresAt.toISOString(),
      deepLink,
      qrPayload: {
        v: 1,
        sid: saved.id,
        code: plainCode,
      },
    };
  }

  async pollPairing(sessionId: string, pairingCode: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException();
    }
    if (
      !session.pairingCodeHash ||
      this.hashPairingCode(pairingCode) !== session.pairingCodeHash
    ) {
      throw new UnauthorizedException();
    }
    await this.maybeExpire(session);
    const refreshed = await this.sessions.findOne({ where: { id: sessionId } });
    if (!refreshed) {
      throw new NotFoundException();
    }
    if (refreshed.status !== TemporaryAuthSessionStatus.ACTIVE) {
      return {
        status: refreshed.status,
        temporaryAccessToken: null as string | null,
      };
    }
    if (!refreshed.userId) {
      throw new UnauthorizedException();
    }
    const token = await this.issueTemporaryToken(refreshed);
    return {
      status: refreshed.status,
      temporaryAccessToken: token,
      expiresAt: refreshed.expiresAt.toISOString(),
    };
  }

  async approvePairing(
    userId: string,
    sessionId: string,
    dto: ApprovePairingDto,
  ) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException();
    }
    if (session.status !== TemporaryAuthSessionStatus.PENDING_PAIRING) {
      throw new BadRequestException('Session is not awaiting pairing');
    }
    if (
      !session.pairingExpiresAt ||
      session.pairingExpiresAt < new Date()
    ) {
      session.status = TemporaryAuthSessionStatus.EXPIRED;
      await this.sessions.save(session);
      throw new BadRequestException('Pairing expired');
    }
    if (this.hashPairingCode(dto.pairingCode) !== session.pairingCodeHash) {
      throw new UnauthorizedException('Invalid pairing code');
    }
    const device = await this.devices.findOne({
      where: { userId, devicePublicId: dto.devicePublicId },
    });
    if (!device) {
      throw new ForbiddenException('Device not registered for this user');
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs());
    session.userId = userId;
    session.approvedByDeviceId = device.id;
    session.status = TemporaryAuthSessionStatus.ACTIVE;
    session.expiresAt = expiresAt;
    session.pairingExpiresAt = null;
    session.lastUsedAt = now;
    await this.sessions.save(session);
    await this.logAudit(session.id, 'pairing_approved', TemporaryAuthAuditActor.PRIMARY_DEVICE, device.id, {
      devicePublicId: dto.devicePublicId,
    });
    const token = await this.issueTemporaryToken(session);
    return {
      sessionId: session.id,
      temporaryAccessToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async issueTemporaryToken(session: TemporaryAuthSession): Promise<string> {
    if (!session.userId) {
      throw new UnauthorizedException();
    }
    const seconds = Math.max(
      60,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    );
    const payload: TemporaryJwtPayload = {
      typ: 'temporary_session',
      sid: session.id,
      sub: session.userId,
    };
    return this.jwt.signAsync(payload as never, { expiresIn: seconds });
  }

  async listSessions(userId: string) {
    const rows = await this.sessions.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map(({ pairingCodeHash: _hash, ...rest }) => rest);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException();
    }
    session.status = TemporaryAuthSessionStatus.REVOKED;
    await this.sessions.save(session);
    await this.logAudit(session.id, 'session_revoked', TemporaryAuthAuditActor.PRIMARY_DEVICE, userId, {});
    return { ok: true };
  }

  async revokeAllSessions(userId: string) {
    const active = await this.sessions.find({
      where: { userId, status: TemporaryAuthSessionStatus.ACTIVE },
    });
    for (const s of active) {
      s.status = TemporaryAuthSessionStatus.REVOKED;
      await this.sessions.save(s);
      await this.logAudit(s.id, 'session_revoked', TemporaryAuthAuditActor.PRIMARY_DEVICE, userId, {
        bulkRevoke: true,
      });
    }
    return { ok: true };
  }

  private async logAudit(
    sessionId: string,
    action: string,
    actor: TemporaryAuthAuditActor,
    actorRef: string | null,
    metadata: Record<string, unknown>,
  ) {
    const row = this.audit.create({
      sessionId,
      action,
      actorType: actor,
      actorRef,
      metadata,
    });
    await this.audit.save(row);
  }

  private async maybeExpire(session: TemporaryAuthSession) {
    const now = new Date();
    if (
      session.status === TemporaryAuthSessionStatus.PENDING_PAIRING &&
      session.pairingExpiresAt &&
      session.pairingExpiresAt < now
    ) {
      session.status = TemporaryAuthSessionStatus.EXPIRED;
      await this.sessions.save(session);
      return;
    }
    if (
      session.status === TemporaryAuthSessionStatus.ACTIVE &&
      session.expiresAt < now
    ) {
      session.status = TemporaryAuthSessionStatus.EXPIRED;
      await this.sessions.save(session);
    }
  }

  purposeAllowed(
    perm: TemporarySessionPermissions,
    purpose: TemporaryCredentialRequestPurpose,
  ): boolean {
    if (purpose === TemporaryCredentialRequestPurpose.AUTOFILL) {
      return perm.allowAutofill !== false;
    }
    if (purpose === TemporaryCredentialRequestPurpose.COPY) {
      return perm.allowCopy === true;
    }
    return perm.allowReveal === true;
  }

  needsBiometricGate(
    perm: TemporarySessionPermissions,
    purpose: TemporaryCredentialRequestPurpose,
  ): boolean {
    if (!perm.requireBiometricPerSensitiveRequest) {
      return false;
    }
    if (purpose === TemporaryCredentialRequestPurpose.AUTOFILL) {
      return false;
    }
    return true;
  }

  async requestDelivery(
    session: TemporaryAuthSession,
    userId: string,
    dto: DeliveryRequestDto,
  ) {
    const current = await this.sessions.findOne({ where: { id: session.id } });
    if (!current || current.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.maybeExpire(current);
    if (current.status !== TemporaryAuthSessionStatus.ACTIVE) {
      throw new UnauthorizedException('Session not active');
    }
    if (!this.originsCompatible(current.allowedOrigin, dto.requestedOrigin)) {
      throw new ForbiddenException('Origin not allowed for this session');
    }
    if (!this.purposeAllowed(current.permissions, dto.purpose)) {
      throw new ForbiddenException('Purpose not permitted');
    }
    const max = current.permissions.maxDeliveries ?? 100;
    if (current.deliveryCount >= max) {
      throw new ForbiddenException('Delivery quota exceeded');
    }

    const credential = await this.credentialsService.findOneForUser(
      dto.credentialId,
      userId,
    );

    if (this.needsBiometricGate(current.permissions, dto.purpose)) {
      const reqEntity = this.deliveries.create({
        sessionId: current.id,
        requestedOrigin: dto.requestedOrigin,
        credentialId: dto.credentialId,
        purpose: dto.purpose,
        status: TemporaryCredentialRequestStatus.PENDING,
        expiresAt: new Date(Date.now() + this.requestTtlMs()),
      });
      const saved = await this.deliveries.save(reqEntity);
      await this.logAudit(current.id, 'delivery_pending', TemporaryAuthAuditActor.REQUESTING_CLIENT, saved.id, {
        purpose: dto.purpose,
        credentialId: dto.credentialId,
      });
      const approvalDeepLink = `passtore://temp-auth/delivery?requestId=${encodeURIComponent(saved.id)}`;
      return {
        needsApproval: true,
        requestId: saved.id,
        expiresAt: saved.expiresAt.toISOString(),
        approvalDeepLink,
      };
    }

    return this.buildDeliveryPayload(current, credential);
  }

  private buildDeliveryPayload(
    session: TemporaryAuthSession,
    credential: {
      id: string;
      loginUsername: string;
      encryptedPassword: string;
      notesEncrypted: string | null;
      alias: string;
      platformName: string;
      url: string | null;
    },
  ) {
    session.deliveryCount += 1;
    session.lastUsedAt = new Date();
    void this.sessions.save(session);
    void this.logAudit(session.id, 'credential_delivered', TemporaryAuthAuditActor.REQUESTING_CLIENT, credential.id, {});
    return {
      needsApproval: false,
      credential: {
        id: credential.id,
        alias: credential.alias,
        platformName: credential.platformName,
        url: credential.url,
        loginUsername: credential.loginUsername,
        encryptedPassword: credential.encryptedPassword,
        notesEncrypted: credential.notesEncrypted,
      },
    };
  }

  async approvePendingDelivery(userId: string, requestId: string) {
    const reqRow = await this.deliveries.findOne({
      where: { id: requestId },
      relations: ['session'],
    });
    if (!reqRow) {
      throw new NotFoundException();
    }
    const session = reqRow.session;
    if (session.userId !== userId) {
      throw new ForbiddenException();
    }
    if (reqRow.status !== TemporaryCredentialRequestStatus.PENDING) {
      throw new BadRequestException('Request not pending');
    }
    if (reqRow.expiresAt < new Date()) {
      reqRow.status = TemporaryCredentialRequestStatus.EXPIRED;
      await this.deliveries.save(reqRow);
      throw new BadRequestException('Request expired');
    }
    reqRow.status = TemporaryCredentialRequestStatus.APPROVED;
    await this.deliveries.save(reqRow);
    await this.logAudit(session.id, 'delivery_approved', TemporaryAuthAuditActor.PRIMARY_DEVICE, requestId, {});
    return { ok: true };
  }

  async pollDelivery(
    session: TemporaryAuthSession,
    userId: string,
    requestId: string,
  ) {
    const reqRow = await this.deliveries.findOne({
      where: { id: requestId, sessionId: session.id },
      relations: ['session'],
    });
    if (!reqRow) {
      throw new NotFoundException();
    }
    const owningSession = reqRow.session;
    if (owningSession.userId !== userId) {
      throw new ForbiddenException();
    }
    const fresh = await this.sessions.findOne({ where: { id: owningSession.id } });
    if (!fresh) {
      throw new NotFoundException();
    }
    await this.maybeExpire(fresh);
    if (reqRow.status === TemporaryCredentialRequestStatus.PENDING) {
      return { status: 'pending' as const };
    }
    if (reqRow.status === TemporaryCredentialRequestStatus.EXPIRED) {
      return { status: 'expired' as const };
    }
    if (reqRow.status === TemporaryCredentialRequestStatus.REJECTED) {
      return { status: 'rejected' as const };
    }
    if (reqRow.status !== TemporaryCredentialRequestStatus.APPROVED) {
      return { status: reqRow.status };
    }
    if (reqRow.deliveredAt) {
      return { status: 'already_delivered' as const };
    }
    const max = fresh.permissions.maxDeliveries ?? 100;
    if (fresh.deliveryCount >= max) {
      throw new ForbiddenException('Delivery quota exceeded');
    }
    const credential = await this.credentialsService.findOneForUser(
      reqRow.credentialId,
      userId,
    );
    fresh.deliveryCount += 1;
    fresh.lastUsedAt = new Date();
    reqRow.deliveredAt = new Date();
    await this.sessions.save(fresh);
    await this.deliveries.save(reqRow);
    await this.logAudit(
      fresh.id,
      'credential_delivered',
      TemporaryAuthAuditActor.REQUESTING_CLIENT,
      credential.id,
      { requestId, gated: true },
    );
    return {
      status: 'ready' as const,
      credential: {
        id: credential.id,
        alias: credential.alias,
        platformName: credential.platformName,
        url: credential.url,
        loginUsername: credential.loginUsername,
        encryptedPassword: credential.encryptedPassword,
        notesEncrypted: credential.notesEncrypted,
      },
    };
  }

  async listAudit(sessionId: string, userId: string) {
    const session = await this.sessions.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException();
    }
    return this.audit.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
