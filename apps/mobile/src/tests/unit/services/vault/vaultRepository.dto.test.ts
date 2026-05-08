import { mapRowToCredentialDto } from '@/services/vault/vaultRepository';

describe('mapRowToCredentialDto', () => {
  it('maps snake_case row to CredentialDto', () => {
    const dto = mapRowToCredentialDto({
      id: '1',
      alias: 'Bank',
      platform_name: 'bank',
      url: 'https://bank.com',
      login_username: 'u',
      encrypted_password: 'cipher',
      encrypted_notes: '',
      icon_url: null,
      strength_score: 80,
      is_duplicate: 0,
      category: null,
      row_version: 2,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      normalized_origin: 'https://bank.com',
    });
    expect(dto.platformName).toBe('bank');
    expect(dto.loginUsername).toBe('u');
    expect(dto.notesEncrypted).toBeNull();
    expect(dto.version).toBe(2);
    expect(dto.normalizedOrigin).toBe('https://bank.com');
  });
});
