import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { SyncGateway } from './sync.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisteredDevice } from './registered-device.entity';
import { SyncEvent } from './sync-event.entity';
import { SyncItemState } from './sync-item-state.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { PushSyncEventDto } from './dto/push-sync-event.dto';
import { decodeSyncCursor, encodeSyncCursor } from './sync-cursor';

export interface SyncEnvelopeResponse {
  id: string;
  userId: string;
  deviceId: string;
  type: string;
  baseRevision?: string;
  ciphertextPayload: string;
  contentHash?: string;
  createdAt: string;
}

export interface SyncPullResult {
  events: SyncEnvelopeResponse[];
  nextCursor: string;
  serverTime: string;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(RegisteredDevice)
    private readonly devices: Repository<RegisteredDevice>,
    @InjectRepository(SyncEvent)
    private readonly events: Repository<SyncEvent>,
    @InjectRepository(SyncItemState)
    private readonly itemStates: Repository<SyncItemState>,
    private readonly syncGateway: SyncGateway,
  ) {}

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ): Promise<RegisteredDevice> {
    return this.upsertDevice(userId, dto);
  }

  private async upsertDevice(
    userId: string,
    dto: RegisterDeviceDto & { devicePublicId: string },
  ): Promise<RegisteredDevice> {
    let row = await this.devices.findOne({
      where: { userId, devicePublicId: dto.devicePublicId },
    });
    const now = new Date();
    if (!row) {
      row = this.devices.create({
        userId,
        devicePublicId: dto.devicePublicId,
        name: dto.name ?? null,
        platform: dto.platform ?? null,
        appVersion: dto.appVersion ?? null,
        lastSeenAt: now,
      });
    } else {
      if (dto.name !== undefined) {
        row.name = dto.name;
      }
      if (dto.platform !== undefined) {
        row.platform = dto.platform;
      }
      if (dto.appVersion !== undefined) {
        row.appVersion = dto.appVersion;
      }
      row.lastSeenAt = now;
    }
    return this.devices.save(row);
  }

  async pushEvent(
    userId: string,
    dto: PushSyncEventDto,
  ): Promise<{ id: string; createdAt: string }> {
    await this.assertNoConflict(userId, dto);

    const device = await this.upsertDevice(userId, {
      devicePublicId: dto.devicePublicId,
      name: dto.deviceName,
      platform: dto.platform,
      appVersion: dto.appVersion,
    });

    const ev = this.events.create({
      userId,
      deviceId: device.id,
      eventType: dto.type,
      baseRevision: dto.baseRevision ?? null,
      ciphertextPayload: dto.ciphertextPayload,
      contentHash: dto.contentHash ?? null,
    });
    const saved = await this.events.save(ev);
    await this.applyItemHeadAfterSuccess(userId, dto);
    this.syncGateway.notifyVaultChanged(userId, { eventId: saved.id });
    return {
      id: saved.id,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async pullEvents(
    userId: string,
    cursor: string | undefined,
    limitRaw: number | undefined,
  ): Promise<SyncPullResult> {
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, limitRaw ?? DEFAULT_LIMIT),
    );

    let after: { createdAt: Date; id: string } | null = null;
    if (cursor !== undefined && cursor !== '') {
      const decoded = decodeSyncCursor(cursor);
      if (!decoded) {
        throw new BadRequestException('Invalid cursor');
      }
      after = decoded;
    }

    const qb = this.events
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.device', 'device')
      .where('e.userId = :userId', { userId })
      .orderBy('e.createdAt', 'ASC')
      .addOrderBy('e.id', 'ASC')
      .take(limit);

    if (after) {
      qb.andWhere(
        '(e.createdAt > :ca OR (e.createdAt = :ca AND e.id > :eid))',
        {
          ca: after.createdAt,
          eid: after.id,
        },
      );
    }

    const rows = await qb.getMany();

    const envelopes: SyncEnvelopeResponse[] = rows.map((e) => ({
      id: e.id,
      userId: e.userId,
      deviceId: e.device.devicePublicId,
      type: e.eventType,
      baseRevision: e.baseRevision ?? undefined,
      ciphertextPayload: e.ciphertextPayload,
      contentHash: e.contentHash ?? undefined,
      createdAt: e.createdAt.toISOString(),
    }));

    let nextCursor = '';
    const last = rows[rows.length - 1];
    if (last) {
      nextCursor = encodeSyncCursor({
        createdAt: last.createdAt,
        id: last.id,
      });
    }

    return {
      events: envelopes,
      nextCursor,
      serverTime: new Date().toISOString(),
    };
  }

  async listDevices(userId: string): Promise<RegisteredDevice[]> {
    return this.devices.find({
      where: { userId },
      order: { lastSeenAt: 'DESC' },
    });
  }

  private async assertNoConflict(
    userId: string,
    dto: PushSyncEventDto,
  ): Promise<void> {
    if (dto.force) {
      return;
    }
    if (!dto.itemKey) {
      return;
    }

    if (dto.type === 'VAULT_ITEM_UPSERT') {
      if (dto.newRowVersion == null) {
        throw new BadRequestException(
          'newRowVersion is required when itemKey is set for VAULT_ITEM_UPSERT',
        );
      }
      await this.assertUpsertNoConflict(userId, dto);
      return;
    }

    if (dto.type === 'VAULT_ITEM_DELETE') {
      await this.assertDeleteNoConflict(userId, dto);
    }
  }

  private async assertUpsertNoConflict(
    userId: string,
    dto: PushSyncEventDto,
  ): Promise<void> {
    const state = await this.itemStates.findOne({
      where: { userId, itemKey: dto.itemKey! },
    });
    const clientBase = dto.baseRowVersion ?? 0;
    if (!state) {
      return;
    }
    if (clientBase !== state.rowVersion) {
      throw new HttpException(
        {
          conflict: true,
          itemKey: dto.itemKey,
          serverRowVersion: state.rowVersion,
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private async assertDeleteNoConflict(
    userId: string,
    dto: PushSyncEventDto,
  ): Promise<void> {
    const state = await this.itemStates.findOne({
      where: { userId, itemKey: dto.itemKey! },
    });
    if (!state) {
      return;
    }
    const clientBase = dto.baseRowVersion ?? -1;
    if (clientBase !== state.rowVersion) {
      throw new HttpException(
        {
          conflict: true,
          itemKey: dto.itemKey,
          serverRowVersion: state.rowVersion,
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private async applyItemHeadAfterSuccess(
    userId: string,
    dto: PushSyncEventDto,
  ): Promise<void> {
    if (dto.type === 'VAULT_ITEM_UPSERT' && dto.itemKey && dto.newRowVersion != null) {
      await this.itemStates.save({
        userId,
        itemKey: dto.itemKey,
        rowVersion: dto.newRowVersion,
      });
    }
    if (dto.type === 'VAULT_ITEM_DELETE' && dto.itemKey) {
      await this.itemStates.delete({ userId, itemKey: dto.itemKey });
    }
  }
}
