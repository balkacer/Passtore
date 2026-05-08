import { useAuthStore } from '@/store/zustand/authStore';

describe('authStore', () => {
  it('sets and clears session', () => {
    const { setSession, clearSession } = useAuthStore.getState();
    setSession('tok', {
      id: '1',
      email: 'a@b.com',
      username: 'user',
    });
    expect(useAuthStore.getState().accessToken).toBe('tok');
    clearSession();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
