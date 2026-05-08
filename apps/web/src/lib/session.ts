import { passtoreApi } from '@/api/passtoreApi';
import { store } from '@/store';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@passtore/core';
import { saveJwt, ensureVaultKey, clearJwt } from '@/lib/webSecureStorage';

export function persistSession(accessToken: string, user: UserProfile) {
  saveJwt(accessToken);
  ensureVaultKey();
  useAuthStore.getState().setSession(accessToken, user);
}

export function logoutSession() {
  clearJwt();
  useAuthStore.getState().clearSession();
  store.dispatch(passtoreApi.util.resetApiState());
}
