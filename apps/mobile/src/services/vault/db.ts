import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { VAULT_DB_NAME } from './constants';
import { runMigrations } from './migrations';

let connection: QuickSQLiteConnection | null = null;

export function getVaultConnection(): QuickSQLiteConnection {
  if (!connection) {
    // Lazy require so Jest / tooling never loads the native binding until open().
    const { open } =
      require('react-native-quick-sqlite') as typeof import('react-native-quick-sqlite');
    connection = open({ name: VAULT_DB_NAME });
    runMigrations(connection);
  }
  return connection;
}

/** Test-only: reset singleton (does not delete DB file). */
export function __resetVaultConnectionForTests(): void {
  connection = null;
}
