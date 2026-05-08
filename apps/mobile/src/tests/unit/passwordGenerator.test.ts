import { generatePassword } from '@/utils/passwordGenerator';

describe('generatePassword', () => {
  it('respects length', () => {
    const pwd = generatePassword({
      length: 24,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeRepeated: false,
      excludeAmbiguous: false,
    });
    expect(pwd.length).toBe(24);
  });

  it('can exclude ambiguous characters when requested', () => {
    const pwd = generatePassword({
      length: 40,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeRepeated: false,
      excludeAmbiguous: true,
    });
    expect(/[O0lI1]/.test(pwd)).toBe(false);
  });
});
