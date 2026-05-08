import {
  evaluatePasswordStrength,
  scoreToSecurityIndicator,
} from '@/utils/passwordStrength';

describe('passwordStrength', () => {
  it('marks common passwords as weak', () => {
    const r = evaluatePasswordStrength('password');
    expect(r.score).toBeLessThan(50);
  });

  it('scores complex passwords higher', () => {
    const r = evaluatePasswordStrength('Ab3!xYz9#mNp2');
    expect(r.score).toBeGreaterThan(70);
  });

  it('maps duplicate flag', () => {
    expect(scoreToSecurityIndicator(80, true)).toBe('duplicate');
  });
});
