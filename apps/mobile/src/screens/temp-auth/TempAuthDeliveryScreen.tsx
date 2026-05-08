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
import { useApproveTemporaryDeliveryMutation } from '@/store/rtk/passtoreApi';
import { promptBiometric, isBiometricAvailable } from '@/services/biometrics/biometricsService';
import { appendTempAuthAudit } from '@/services/temp-auth/tempAuthLocalAudit';

type Nav = NativeStackNavigationProp<MainStackParamList, 'TempAuthDelivery'>;
type R = RouteProp<MainStackParamList, 'TempAuthDelivery'>;

export function TempAuthDeliveryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { requestId } = route.params;
  const [approve, { isLoading }] = useApproveTemporaryDeliveryMutation();
  const [busy, setBusy] = useState(false);

  const onApprove = async () => {
    if (isLoading || busy) {
      return;
    }
    setBusy(true);
    try {
      const bioOk = (await isBiometricAvailable())
        ? await promptBiometric('Confirma para enviar esta credencial al cliente temporal')
        : true;
      if (!bioOk) {
        await appendTempAuthAudit('temp_auth_delivery_biometric_cancel', { requestId });
        setBusy(false);
        return;
      }
      await approve({ requestId }).unwrap();
      await appendTempAuthAudit('temp_auth_delivery_approved', { requestId });
      Alert.alert('Listo', 'La solicitud fue aprobada. El otro dispositivo puede recibir el dato cifrado.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (e) {
      console.warn(e);
      await appendTempAuthAudit('temp_auth_delivery_error', {
        requestId,
        message: e instanceof Error ? e.message : String(e),
      });
      Alert.alert(
        'No se pudo aprobar',
        'La solicitud puede haber expirado o ya fue procesada.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.card}>
        <Text style={styles.title}>Solicitud sensible</Text>
        <Text style={styles.body}>
          Se solicitó copiar o revelar una credencial desde una sesión temporal. Aprueba solo si
          reconoces la acción.
        </Text>
        <Text style={styles.meta}>Solicitud: {requestId.slice(0, 8)}…</Text>
      </View>
      <Pressable
        style={[styles.primary, (isLoading || busy) && styles.primaryDisabled]}
        onPress={() => void onApprove()}
        disabled={isLoading || busy}>
        {isLoading || busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Aprobar con biometría</Text>
        )}
      </Pressable>
      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate('Home')}
        disabled={isLoading || busy}>
        <Text style={styles.secondaryText}>Cerrar</Text>
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
