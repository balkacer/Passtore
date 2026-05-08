/**
 * Opaque cursor for incremental pull: base64url( ISO8601|uuid ).
 * Ordering matches PostgreSQL (created_at, id) lexicographic compare.
 */
export type SyncCursorParts = { createdAt: Date; id: string };

export function encodeSyncCursor(parts: SyncCursorParts): string {
  const raw = `${parts.createdAt.toISOString()}|${parts.id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

export function decodeSyncCursor(cursor: string): SyncCursorParts | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const pipe = raw.indexOf('|');
    if (pipe <= 0) {
      return null;
    }
    const iso = raw.slice(0, pipe);
    const id = raw.slice(pipe + 1);
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime()) || !id) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}
