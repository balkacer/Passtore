import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '@/store/zustand/authStore';

export function RootNavigator() {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <MainNavigator /> : <AuthNavigator />;
}
