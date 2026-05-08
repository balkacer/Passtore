import {
  normalizeOrigin,
  rankCredentialsForFill,
} from '@/services/autofill/autofillMatchingEngine';
import type { CredentialIndexRow } from '@passtore/core';

describe('autofillMatchingEngine', () => {
  it('normalizes origins', () => {
    expect(normalizeOrigin('example.com')).toBe('https://example.com');
    expect(normalizeOrigin('https://app.example.com/path')).toBe(
      'https://app.example.com',
    );
  });

  it('ranks exact origin highest', () => {
    const rows: CredentialIndexRow[] = [
      {
        id: 'a',
        alias: 'Ex',
        normalizedOrigin: 'https://example.com',
        platformName: 'web',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'b',
        alias: 'Other',
        normalizedOrigin: 'https://other.com',
        platformName: 'web',
        updatedAt: new Date().toISOString(),
      },
    ];
    const ranked = rankCredentialsForFill(rows, {
      origin: 'https://example.com/login',
    });
    expect(ranked[0]?.credentialId).toBe('a');
  });
});
