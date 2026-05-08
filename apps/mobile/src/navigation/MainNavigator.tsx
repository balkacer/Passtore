import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { CreateCredentialScreen } from '@/screens/vault/CreateCredentialScreen';
import { PasswordDetailScreen } from '@/screens/vault/PasswordDetailScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { ConflictListScreen } from '@/screens/sync/ConflictListScreen';
import { ConflictResolutionScreen } from '@/screens/sync/ConflictResolutionScreen';
import { TempAuthPairingScreen } from '@/screens/temp-auth/TempAuthPairingScreen';
import { TempAuthDeliveryScreen } from '@/screens/temp-auth/TempAuthDeliveryScreen';
import { SecurityTempAuthScreen } from '@/screens/security/SecurityTempAuthScreen';
import { colors } from '@/theme/colors';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateCredential"
        component={CreateCredentialScreen}
        options={{ title: 'Nueva credencial' }}
      />
      <Stack.Screen
        name="PasswordDetail"
        component={PasswordDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Stack.Screen
        name="ConflictList"
        component={ConflictListScreen}
        options={{ title: 'Conflictos de sincronización' }}
      />
      <Stack.Screen
        name="ConflictResolution"
        component={ConflictResolutionScreen}
        options={{ title: 'Resolver conflicto' }}
      />
      <Stack.Screen
        name="TempAuthPairing"
        component={TempAuthPairingScreen}
        options={{ title: 'Acceso temporal' }}
      />
      <Stack.Screen
        name="TempAuthDelivery"
        component={TempAuthDeliveryScreen}
        options={{ title: 'Credencial temporal' }}
      />
      <Stack.Screen
        name="SecurityTempAuth"
        component={SecurityTempAuthScreen}
        options={{ title: 'Seguridad · acceso temporal' }}
      />
    </Stack.Navigator>
  );
}
