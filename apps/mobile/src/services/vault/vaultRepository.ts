import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import type { CreateCredentialBody, CredentialDto } from '@passtore/core';
import { normalizeOrigin } from '@/services/autofill/autofillMatchingEngine';
import { getVaultConnection } from './db';

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function mapRowToCredentialDto(row: Record<string, unknown>): CredentialDto {
  return {
    id: String(row.id),
    alias: String(row.alias),
    platformName: String(row.platform_name),
    url: row.url != null && row.url !== '' ? String(row.url) : null,
    loginUsername: String(row.login_username),
    encryptedPassword: String(row.encrypted_password),
    iconUrl: row.icon_url != null && row.icon_url !== '' ? String(row.icon_url) : null,
    notesEncrypted:
      row.encrypted_notes != null && row.encrypted_notes !== ''
        ? String(row.encrypted_notes)
        : null,
    strengthScore:
      row.strength_score != null && row.strength_score !== ''
        ? Number(row.strength_score)
        : null,
    isDuplicate: Boolean(row.is_duplicate),
    category: row.category != null && row.category !== '' ? String(row.category) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    version: row.row_version != null ? Number(row.row_version) : undefined,
    normalizedOrigin:
      row.normalized_origin != null && row.normalized_origin !== ''
        ? String(row.normalized_origin)
        : null,
  };
}

export class VaultRepository {
  constructor(private readonly conn: QuickSQLiteConnection) {}

  async listAll(): Promise<CredentialDto[]> {
    const r = await this.conn.executeAsync(
      `SELECT * FROM credentials WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
    );
    if (!r.rows || r.rows.length === 0) {
      return [];
    }
    const out: CredentialDto[] = [];
    for (let i = 0; i < r.rows.length; i++) {
      out.push(mapRowToCredentialDto(r.rows.item(i) as Record<string, unknown>));
    }
    return out;
  }

  async getById(id: string): Promise<CredentialDto | null> {
    const r = await this.conn.executeAsync(
      `SELECT * FROM credentials WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    if (!r.rows || r.rows.length === 0) {
      return null;
    }
    return mapRowToCredentialDto(r.rows.item(0) as Record<string, unknown>);
  }

  async create(body: CreateCredentialBody): Promise<CredentialDto> {
    const id = newId();
    const now = new Date().toISOString();
    const norm = body.url ? normalizeOrigin(body.url) : null;
    const notes = body.notesEncrypted ?? '';
    await this.conn.executeAsync(
      `INSERT INTO credentials (
        id, alias, platform_name, url, login_username, encrypted_password, encrypted_notes,
        icon_url, strength_score, is_duplicate, category, row_version, created_at, updated_at, normalized_origin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        id,
        body.alias,
        body.platformName,
        body.url ?? null,
        body.loginUsername,
        body.encryptedPassword,
        notes,
        body.iconUrl ?? null,
        body.strengthScore ?? null,
        body.isDuplicate ? 1 : 0,
        body.category ?? null,
        now,
        now,
        norm,
      ],
    );
    const row = await this.getById(id);
    if (!row) {
      throw new Error('VaultRepository.create: row missing after insert');
    }
    return row;
  }

  async update(id: string, patch: Partial<CreateCredentialBody>): Promise<CredentialDto> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('VaultRepository.update: not found');
    }
    const now = new Date().toISOString();
    const alias = patch.alias ?? existing.alias;
    const platformName = patch.platformName ?? existing.platformName;
    const url = patch.url !== undefined ? patch.url ?? null : existing.url;
    const loginUsername = patch.loginUsername ?? existing.loginUsername;
    const encryptedPassword = patch.encryptedPassword ?? existing.encryptedPassword;
    const encryptedNotes =
      patch.notesEncrypted !== undefined
        ? patch.notesEncrypted ?? ''
        : existing.notesEncrypted ?? '';
    const iconUrl =
      patch.iconUrl !== undefined ? patch.iconUrl ?? null : existing.iconUrl;
    const strengthScore =
      patch.strengthScore !== undefined ? patch.strengthScore ?? null : existing.strengthScore;
    const isDuplicate =
      patch.isDuplicate !== undefined ? patch.isDuplicate : existing.isDuplicate;
    const category =
      patch.category !== undefined ? patch.category ?? null : existing.category;
    const norm = url ? normalizeOrigin(url) : null;
    const nextVersion = (existing.version ?? 1) + 1;

    await this.conn.executeAsync(
      `UPDATE credentials SET
        alias = ?, platform_name = ?, url = ?, login_username = ?, encrypted_password = ?,
        encrypted_notes = ?, icon_url = ?, strength_score = ?, is_duplicate = ?, category = ?,
        row_version = ?, updated_at = ?, normalized_origin = ?
      WHERE id = ?`,
      [
        alias,
        platformName,
        url,
        loginUsername,
        encryptedPassword,
        encryptedNotes,
        iconUrl,
        strengthScore,
        isDuplicate ? 1 : 0,
        category,
        nextVersion,
        now,
        norm,
        id,
      ],
    );
    const row = await this.getById(id);
    if (!row) {
      throw new Error('VaultRepository.update: row missing after update');
    }
    return row;
  }

  async delete(id: string): Promise<{ ok: boolean }> {
    await this.conn.executeAsync(`DELETE FROM credentials WHERE id = ?`, [id]);
    return { ok: true };
  }

  /** Upsert full row from remote sync (encrypted fields unchanged). */
  async replaceCredential(dto: CredentialDto): Promise<CredentialDto> {
    const notes = dto.notesEncrypted ?? '';
    const norm =
      dto.normalizedOrigin ??
      (dto.url ? normalizeOrigin(dto.url) : null);
    await this.conn.executeAsync(
      `INSERT OR REPLACE INTO credentials (
        id, alias, platform_name, url, login_username, encrypted_password, encrypted_notes,
        icon_url, strength_score, is_duplicate, category, row_version, created_at, updated_at,
        normalized_origin, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        dto.id,
        dto.alias,
        dto.platformName,
        dto.url ?? null,
        dto.loginUsername,
        dto.encryptedPassword,
        notes,
        dto.iconUrl ?? null,
        dto.strengthScore ?? null,
        dto.isDuplicate ? 1 : 0,
        dto.category ?? null,
        dto.version ?? 1,
        dto.createdAt,
        dto.updatedAt,
        norm,
      ],
    );
    const row = await this.getById(dto.id);
    if (!row) {
      throw new Error('VaultRepository.replaceCredential: missing row');
    }
    return row;
  }
}

let repoSingleton: VaultRepository | null = null;

export function getVaultRepository(): VaultRepository {
  if (!repoSingleton) {
    repoSingleton = new VaultRepository(getVaultConnection());
  }
  return repoSingleton;
}

export function __resetVaultRepositoryForTests(): void {
  repoSingleton = null;
}
