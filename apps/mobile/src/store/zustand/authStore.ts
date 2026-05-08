import { create } from 'zustand';
import type { UserProfile } from '@passtore/core';

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  setSession: (token: string, user: UserProfile) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (token, user) =>
    set({ accessToken: token, user }),
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (value) => set({ hydrated: value }),
}));
