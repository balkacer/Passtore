const COMMON = new Set(['password', '123456', 'qwerty', 'letmein']);

export type StrengthLabel = 'weak' | 'fair' | 'good' | 'strong';

export interface StrengthResult {
  score: number;
  label: StrengthLabel;
}

/** Misma heurística que `apps/web/src/lib/passwordStrength.ts`. */
export function evaluatePasswordStrength(password: string): StrengthResult {
  let score = 0;
  if (password.length >= 8) {
    score += 20;
  }
  if (password.length >= 12) {
    score += 15;
  }
  if (/[a-z]/.test(password)) {
    score += 15;
  }
  if (/[A-Z]/.test(password)) {
    score += 15;
  }
  if (/[0-9]/.test(password)) {
    score += 15;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 15;
  }
  if (COMMON.has(password.toLowerCase())) {
    score = Math.min(score, 25);
  }

  const label: StrengthLabel =
    score < 40 ? 'weak' : score < 65 ? 'fair' : score < 85 ? 'good' : 'strong';

  return { score: Math.min(100, score), label };
}
