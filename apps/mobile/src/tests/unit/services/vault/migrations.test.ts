import { migration1, migration2, migration3 } from '@/services/vault/migrations';

describe('migrations', () => {
  it('migration2 adds deleted_at for soft-delete / sync future use', () => {
    const executed: string[] = [];
    const conn = {
      execute: jest.fn((sql: string) => {
        executed.push(sql);
      }),
    };
    migration2(conn);
    expect(executed.some((s) => s.includes('deleted_at'))).toBe(true);
  });

  it('migration3 creates sync_outbox table', () => {
    const executed: string[] = [];
    const conn = {
      execute: jest.fn((sql: string) => {
        executed.push(sql);
      }),
    };
    migration3(conn);
    expect(executed.some((s) => s.includes('sync_outbox'))).toBe(true);
  });

  it('migration1 creates credentials table', () => {
    const executed: string[] = [];
    const conn = {
      execute: jest.fn((sql: string) => {
        executed.push(sql);
      }),
    };
    migration1(conn);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS credentials'))).toBe(
      true,
    );
  });
});
