import {
  deleteBaseMatchesServer,
  rowVersionsConflict,
  upsertBaseMatchesServer,
} from '@/services/sync/conflictEngine';

describe('conflictEngine', () => {
  describe('rowVersionsConflict', () => {
    it('returns false when base equals server head', () => {
      expect(rowVersionsConflict(3, 3)).toBe(false);
    });
    it('returns true when base differs from server head', () => {
      expect(rowVersionsConflict(2, 5)).toBe(true);
    });
  });

  describe('upsertBaseMatchesServer', () => {
    it('allows base 0 when server has no row', () => {
      expect(upsertBaseMatchesServer(false, 0, 0)).toBe(true);
    });
    it('rejects non-zero base when server has no row', () => {
      expect(upsertBaseMatchesServer(false, 1, 0)).toBe(false);
    });
    it('matches when server has row and base equals head', () => {
      expect(upsertBaseMatchesServer(true, 4, 4)).toBe(true);
    });
    it('conflicts when server has row and base differs', () => {
      expect(upsertBaseMatchesServer(true, 3, 4)).toBe(false);
    });
  });

  describe('deleteBaseMatchesServer', () => {
    it('allows delete when server has no row', () => {
      expect(deleteBaseMatchesServer(false, 99, 0)).toBe(true);
    });
    it('matches when base equals head', () => {
      expect(deleteBaseMatchesServer(true, 2, 2)).toBe(true);
    });
    it('conflicts when base differs', () => {
      expect(deleteBaseMatchesServer(true, 1, 2)).toBe(false);
    });
  });
});
