import { describe, expect, it } from 'vitest';
import {
  evaluatePasswordStrength,
  scoreToSecurityIndicator,
} from '@/lib/passwordStrength';

describe('evaluatePasswordStrength', () => {
  it('caps score for common passwords', () => {
    const r = evaluatePasswordStrength('password');
    expect(r.label).toBe('weak');
    expect(r.score).toBeLessThanOrEqual(25);
  });

  it('rates strong diverse passwords highly', () => {
    const r = evaluatePasswordStrength('Aa1!aaaaaaaaaaaa');
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.label).toBe('strong');
  });
});

describe('scoreToSecurityIndicator', () => {
  it('returns duplicate when flagged', () => {
    expect(scoreToSecurityIndicator(90, true)).toBe('duplicate');
  });

  it('maps low scores to weak', () => {
    expect(scoreToSecurityIndicator(40, false)).toBe('weak');
  });

  it('maps higher scores to strong', () => {
    expect(scoreToSecurityIndicator(50, false)).toBe('strong');
  });
});
