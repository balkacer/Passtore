import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';

/** Reads schema_version from vault_meta (0 if missing). */
export function getSchemaVersion(conn: QuickSQLiteConnection): number {
  conn.execute(
    `CREATE TABLE IF NOT EXISTS vault_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )`,
  );
  const r = conn.execute(`SELECT value FROM vault_meta WHERE key = 'schema_version'`);
  if (r.rows && r.rows.length > 0) {
    const v = parseInt(String(r.rows.item(0).value), 10);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

export function setSchemaVersion(conn: QuickSQLiteConnection, version: number): void {
  conn.execute(`INSERT OR REPLACE INTO vault_meta (key, value) VALUES ('schema_version', ?)`, [
    String(version),
  ]);
}

export function migration1(conn: Pick<QuickSQLiteConnection, 'execute'>): void {
  conn.execute(`CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY NOT NULL,
    alias TEXT NOT NULL,
    platform_name TEXT NOT NULL,
    url TEXT,
    login_username TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    encrypted_notes TEXT NOT NULL DEFAULT '',
    icon_url TEXT,
    metadata TEXT,
    strength_score INTEGER,
    is_duplicate INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    row_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    normalized_origin TEXT
  )`);

  conn.execute(
    `CREATE INDEX IF NOT EXISTS idx_credentials_updated ON credentials(updated_at DESC)`,
  );
}

/** Soft-delete + sync placeholder (Phase 2+). */
export function migration2(conn: Pick<QuickSQLiteConnection, 'execute'>): void {
  conn.execute(`ALTER TABLE credentials ADD COLUMN deleted_at TEXT`);
}

/** Offline sync outbox (Phase 3). */
export function migration3(conn: Pick<QuickSQLiteConnection, 'execute'>): void {
  conn.execute(`CREATE TABLE IF NOT EXISTS sync_outbox (
    id TEXT PRIMARY KEY NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
  )`);
  conn.execute(
    `CREATE INDEX IF NOT EXISTS idx_sync_outbox_created ON sync_outbox(created_at ASC)`,
  );
}

export type MigrationFn = (conn: Pick<QuickSQLiteConnection, 'execute'>) => void;

export const MIGRATIONS: { targetVersion: number; up: MigrationFn }[] = [
  { targetVersion: 1, up: migration1 },
  { targetVersion: 2, up: migration2 },
  { targetVersion: 3, up: migration3 },
];

/** Applies migrations sequentially until DB reaches latest defined version. */
export function runMigrations(conn: QuickSQLiteConnection): void {
  let current = getSchemaVersion(conn);
  const steps = [...MIGRATIONS].sort((a, b) => a.targetVersion - b.targetVersion);
  for (const step of steps) {
    if (current < step.targetVersion) {
      step.up(conn);
      setSchemaVersion(conn, step.targetVersion);
      current = step.targetVersion;
    }
  }
}
