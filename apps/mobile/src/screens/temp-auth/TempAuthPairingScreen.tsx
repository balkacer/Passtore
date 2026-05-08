import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useApproveTemporaryPairingMutation } from '@/store/rtk/passtoreApi';
import { getDevicePublicId } from '@/services/sync/devicePublicId';
import { promptBiometric, isBiometricAvailable } from '@/services/biometrics/biometricsService';
import { appendTempAuthAudit } from '@/services/temp-auth/tempAuthLocalAudit';

type Nav = NativeStackNavigationProp<MainStackParamList, 'TempAuthPairing'>;
type R = RouteProp<MainStackParamList, 'TempAuthPairing'>;

export function TempAuthPairingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { sessionId, pairingCode } = route.params;
  const [approve, { isLoading }] = useApproveTemporaryPairingMutation();
  const [busy, setBusy] = useState(false);

  const onApprove = async () => {
    if (isLoading || busy) {
      return;
    }
    setBusy(true);
    try {
      const bioOk = (await isBiometricAvailable())
        ? await promptBiometric('Confirma con biometría para autorizar el acceso temporal')
        : true;
      if (!bioOk) {
        await appendTempAuthAudit('temp_auth_pairing_biometric_cancel');
        setBusy(false);
        return;
      }
      const devicePublicId = await getDevicePublicId();
      await approve({
        sessionId,
        pairingCode,
        devicePublicId,
      }).unwrap();
      await appendTempAuthAudit('temp_auth_pairing_approved', { sessionId });
      Alert.alert('Listo', 'Sesión temporal autorizada.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (e) {
      console.warn(e);
      await appendTempAuthAudit('temp_auth_pairing_error', {
        message: e instanceof Error ? e.message : String(e),
      });
      Alert.alert(
        'No se pudo autorizar',
        'Revisa conexión, que el código no haya expirado y que este dispositivo esté registrado.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    void appendTempAuthAudit('temp_auth_pairing_declined', { sessionId });
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.card}>
        <Text style={styles.title}>Acceso temporal</Text>
        <Text style={styles.body}>
          Un navegador o extensión solicita acceso limitado a credenciales para un origen
          concreto. Solo se entregarán credenciales una a una; no se sincroniza el vault
          completo.
        </Text>
        <Text style={styles.meta}>Sesión: {sessionId.slice(0, 8)}…</Text>
      </View>
      <Pressable
        style={[styles.primary, (isLoading || busy) && styles.primaryDisabled]}
        onPress={() => void onApprove()}
        disabled={isLoading || busy}>
        {isLoading || busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Autorizar con biometría</Text>
        )}
      </Pressable>
      <Pressable style={styles.secondary} onPress={onCancel} disabled={isLoading || busy}>
        <Text style={styles.secondaryText}>Cancelar</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.6 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: colors.textSecondary, fontSize: 16 },
});
