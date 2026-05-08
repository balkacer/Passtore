import { credentialDtoToIndexRow, rankVaultCredentialsForAutofill } from '@/services/autofill/credentialIndex';
import type { CredentialDto } from '@passtore/core';

function baseDto(partial: Partial<CredentialDto>): CredentialDto {
  return {
    id: 'id-1',
    alias: 'A',
    platformName: 'web',
    url: 'https://example.com',
    loginUsername: 'u',
    encryptedPassword: 'x',
    iconUrl: null,
    notesEncrypted: null,
    strengthScore: null,
    isDuplicate: false,
    category: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    version: 1,
    ...partial,
  };
}

describe('credentialIndex', () => {
  it('prefers stored normalizedOrigin over recomputing from url', () => {
    const row = credentialDtoToIndexRow(
      baseDto({
        url: 'https://ignored.example/path',
        normalizedOrigin: 'https://app.example.com',
      }),
    );
    expect(row.normalizedOrigin).toBe('https://app.example.com');
  });

  it('ranks vault DTOs using index mapping', () => {
    const ranked = rankVaultCredentialsForAutofill(
      [
        baseDto({
          id: 'good',
          url: 'https://bank.com',
          normalizedOrigin: 'https://bank.com',
        }),
        baseDto({
          id: 'bad',
          url: 'https://other.org',
          normalizedOrigin: 'https://other.org',
        }),
      ],
      { origin: 'https://bank.com/login' },
    );
    expect(ranked[0]?.credentialId).toBe('good');
  });
});
