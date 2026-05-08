import { store } from '@/store/rtk/store';
import { passtoreApi } from '@/store/rtk/passtoreApi';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { useAuthStore } from '@/store/zustand/authStore';
import { useConflictStore } from '@/store/zustand/conflictStore';
import type { UserProfile } from '@passtore/core';

export async function persistSession(accessToken: string, user: UserProfile) {
  await SecureStorage.saveJwt(accessToken);
  await SecureStorage.ensureVaultKey();
  useAuthStore.getState().setSession(accessToken, user);
}

export async function logoutSession() {
  await SecureStorage.clearJwt();
  useAuthStore.getState().clearSession();
  useConflictStore.getState().clearConflicts();
  store.dispatch(passtoreApi.util.resetApiState());
}
