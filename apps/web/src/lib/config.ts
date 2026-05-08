/** Base URL for REST API. Dev default uses Vite proxy `/api` → backend :3000 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, '');
  }
  return '/api';
}
