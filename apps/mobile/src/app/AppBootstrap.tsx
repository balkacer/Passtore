import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRootRef } from '@/navigation/navigationRootRef';
import { TempAuthLinkingBootstrap } from './TempAuthLinkingBootstrap';
import { TempAuthNavigationEffects } from './TempAuthNavigationEffects';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { useAuthStore } from '@/store/zustand/authStore';
import { useProfileQuery } from '@/store/rtk/passtoreApi';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme/colors';
import { SyncCoordinator } from '@/services/sync/SyncCoordinator';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.borderHairline,
    notification: colors.accentCoral,
  },
};

export function AppBootstrap() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  const { data, error } = useProfileQuery(undefined, {
    skip: !hydrated || !token,
  });

  useEffect(() => {
    void (async () => {
      const jwt = await SecureStorage.getJwt();
      if (jwt) {
        setToken(jwt);
      }
      setHydrated(true);
    })();
  }, [setHydrated, setToken]);

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      void SecureStorage.clearJwt();
      clearSession();
    }
  }, [clearSession, error]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRootRef} theme={theme}>
      <TempAuthLinkingBootstrap />
      <TempAuthNavigationEffects />
      <SyncCoordinator />
      <RootNavigator />
    </NavigationContainer>
  );
}
