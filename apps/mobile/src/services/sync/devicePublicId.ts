import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.passtore.device.public.id';
const USER = 'device';

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable public device id for sync / WebSocket scope (stored in Keychain). */
export async function getDevicePublicId(): Promise<string> {
  const existing = await Keychain.getGenericPassword({ service: SERVICE });
  if (existing?.password) {
    return existing.password;
  }
  const id = randomId();
  await Keychain.setGenericPassword(USER, id, {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return id;
}
