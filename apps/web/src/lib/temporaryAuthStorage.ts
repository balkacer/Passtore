const KEY = 'passtore.tempAuth.jwt';

export function getTemporaryJwt(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setTemporaryJwt(token: string): void {
  sessionStorage.setItem(KEY, token);
}

export function clearTemporaryJwt(): void {
  sessionStorage.removeItem(KEY);
}
