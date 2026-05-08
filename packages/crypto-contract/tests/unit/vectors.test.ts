import { describe, expect, it } from 'vitest';
import {
  CONTRACT_CIPHERTEXT,
  CONTRACT_PLAINTEXT,
  CONTRACT_VAULT_KEY,
} from '../../src/index.ts';

describe('@passtore/crypto-contract golden vectors', () => {
  it('exports interoperable vault contract material', () => {
    expect(CONTRACT_VAULT_KEY.length).toBeGreaterThan(0);
    expect(CONTRACT_PLAINTEXT.length).toBeGreaterThan(0);
    expect(CONTRACT_CIPHERTEXT.startsWith('U2FsdGVkX1')).toBe(true);
  });
});
