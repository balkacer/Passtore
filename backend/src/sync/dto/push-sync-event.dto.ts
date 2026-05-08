import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Allowed event types — opaque payloads only. */
export const SYNC_EVENT_TYPES = [
  'VAULT_ITEM_UPSERT',
  'VAULT_ITEM_DELETE',
  'SNAPSHOT_PUSH',
  'DEVICE_REGISTER',
] as const;

export type SyncEventTypeDto = (typeof SYNC_EVENT_TYPES)[number];

export class PushSyncEventDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  devicePublicId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;

  @IsString()
  @IsIn(SYNC_EVENT_TYPES)
  type!: SyncEventTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  baseRevision?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5_000_000)
  ciphertextPayload!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentHash?: string;

  /** Credential id — enables optimistic concurrency with {@link baseRowVersion} / {@link newRowVersion}. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  itemKey?: string;

  /** Expected server row version before this change (0 for brand-new items). */
  @IsOptional()
  @IsInt()
  @Min(0)
  baseRowVersion?: number;

  /** Row version after this change (required with itemKey on upsert). */
  @IsOptional()
  @IsInt()
  @Min(1)
  newRowVersion?: number;

  /** Skip conflict checks (user-confirmed resolution). */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
