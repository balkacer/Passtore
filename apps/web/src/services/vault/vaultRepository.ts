import type { CreateCredentialBody, CredentialDto } from '@passtore/core';
import { normalizeOrigin } from '@/lib/urlOrigin';
import { openVaultDb } from '@/services/vault/idb';

function newId(): string {
  return crypto.randomUUID();
}

export class VaultRepository {
  async listAll(): Promise<CredentialDto[]> {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('credentials', 'readonly');
      const req = tx.objectStore('credentials').getAll();
      req.onsuccess = () => {
        const rows = (req.result as CredentialDto[]).filter(Boolean);
        rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        resolve(rows);
      };
      req.onerror = () => reject(req.error ?? new Error('listAll'));
    });
  }

  async getById(id: string): Promise<CredentialDto | null> {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('credentials', 'readonly');
      const req = tx.objectStore('credentials').get(id);
      req.onsuccess = () => resolve((req.result as CredentialDto | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('getById'));
    });
  }

  async create(body: CreateCredentialBody): Promise<CredentialDto> {
    const id = newId();
    const now = new Date().toISOString();
    const url = body.url ?? null;
    const row: CredentialDto = {
      id,
      alias: body.alias,
      platformName: body.platformName,
      url,
      normalizedOrigin: url ? normalizeOrigin(url) : null,
      loginUsername: body.loginUsername,
      encryptedPassword: body.encryptedPassword,
      iconUrl: body.iconUrl ?? null,
      notesEncrypted: body.notesEncrypted ?? null,
      strengthScore: body.strengthScore ?? null,
      isDuplicate: body.isDuplicate ?? false,
      category: body.category ?? null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('credentials', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('create'));
      tx.objectStore('credentials').put(row);
    });
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
    const normalizedOrigin =
      patch.url !== undefined
        ? url
          ? normalizeOrigin(url)
          : null
        : existing.normalizedOrigin ?? (url ? normalizeOrigin(url) : null);
    const loginUsername = patch.loginUsername ?? existing.loginUsername;
    const encryptedPassword = patch.encryptedPassword ?? existing.encryptedPassword;
    const notesEncrypted =
      patch.notesEncrypted !== undefined
        ? patch.notesEncrypted ?? null
        : existing.notesEncrypted;
    const iconUrl =
      patch.iconUrl !== undefined ? patch.iconUrl ?? null : existing.iconUrl;
    const strengthScore =
      patch.strengthScore !== undefined ? patch.strengthScore ?? null : existing.strengthScore;
    const isDuplicate =
      patch.isDuplicate !== undefined ? patch.isDuplicate : existing.isDuplicate;
    const category =
      patch.category !== undefined ? patch.category ?? null : existing.category;
    const nextVersion = (existing.version ?? 1) + 1;
    const row: CredentialDto = {
      ...existing,
      alias,
      platformName,
      url,
      normalizedOrigin,
      loginUsername,
      encryptedPassword,
      notesEncrypted,
      iconUrl,
      strengthScore,
      isDuplicate,
      category,
      updatedAt: now,
      version: nextVersion,
    };
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('credentials', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('update'));
      tx.objectStore('credentials').put(row);
    });
    return row;
  }

  async delete(id: string): Promise<{ ok: boolean }> {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('credentials', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('delete'));
      tx.objectStore('credentials').delete(id);
    });
    return { ok: true };
  }

  async replaceCredential(dto: CredentialDto): Promise<CredentialDto> {
    const db = await openVaultDb();
    const normalizedOrigin =
      dto.normalizedOrigin ??
      (dto.url ? normalizeOrigin(dto.url) : null);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('credentials', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('replaceCredential'));
      tx.objectStore('credentials').put({
        ...dto,
        version: dto.version ?? 1,
        normalizedOrigin,
      });
    });
    const row = await this.getById(dto.id);
    if (!row) {
      throw new Error('VaultRepository.replaceCredential: missing row');
    }
    return row;
  }
}

let singleton: VaultRepository | null = null;

export function getVaultRepository(): VaultRepository {
  if (!singleton) {
    singleton = new VaultRepository();
  }
  return singleton;
}
