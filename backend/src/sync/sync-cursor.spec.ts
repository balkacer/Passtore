import { decodeSyncCursor, encodeSyncCursor } from './sync-cursor';

describe('sync-cursor', () => {
  it('round-trips', () => {
    const createdAt = new Date('2026-05-08T12:00:00.000Z');
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const token = encodeSyncCursor({ createdAt, id });
    const back = decodeSyncCursor(token);
    expect(back).not.toBeNull();
    expect(back!.id).toBe(id);
    expect(back!.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('returns null for garbage', () => {
    expect(decodeSyncCursor('not-valid')).toBeNull();
  });
});
