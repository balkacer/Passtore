import { Platform } from 'react-native';

/** Override for physical device / LAN testing — set your Mac IP when running on iPhone. */
export const DEV_API_HOST_OVERRIDE = '';

export function getApiBaseUrl(): string {
  if (__DEV__) {
    if (DEV_API_HOST_OVERRIDE) {
      return `http://${DEV_API_HOST_OVERRIDE}:3000`;
    }
    return Platform.select({
      android: 'http://10.0.2.2:3000',
      ios: 'http://localhost:3000',
      default: 'http://localhost:3000',
    })!;
  }
  return 'https://api.passtore.example';
}
