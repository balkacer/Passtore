import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useConflictStore } from '@/store/zustand/conflictStore';
import { getOutboxRepository } from '@/services/sync/outboxRepository';
import { flushSyncOutbox } from '@/services/sync/syncOutboxWorker';
import { pullAndApplyRemoteSync } from '@/services/sync/syncPullService';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ConflictResolution'>;
type R = RouteProp<MainStackParamList, 'ConflictResolution'>;

export function ConflictResolutionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { conflictId } = route.params;
  const entry = useConflictStore((s) =>
    s.conflicts.find((c) => c.id === conflictId),
  );
  const removeConflict = useConflictStore((s) => s.removeConflict);

  const [busy, setBusy] = useState<'server' | 'force' | null>(null);

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.card}>
          <Text style={styles.heading}>Conflicto no encontrado</Text>
          <PrimaryButton title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const baseRv = entry.payload.baseRowVersion ?? 0;
  const typeLabel =
    entry.payload.type === 'VAULT_ITEM_DELETE'
      ? 'Eliminación'
      : 'Guardado';

  const useServer = async () => {
    setBusy('server');
    try {
      await getOutboxRepository().remove(entry.outboxRowId);
      await pullAndApplyRemoteSync();
      removeConflict(entry.id);
      navigation.goBack();
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo aplicar la versión del servidor.');
    } finally {
      setBusy(null);
    }
  };

  const forceLocal = async () => {
    setBusy('force');
    try {
      const next = { ...entry.payload, force: true as const };
      await getOutboxRepository().updatePayload(entry.outboxRowId, next);
      await flushSyncOutbox();
      removeConflict(entry.id);
      navigation.goBack();
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo enviar el cambio forzado.');
    } finally {
      setBusy(null);
    }
  };

  const duplicatePlaceholder = () => {
    Alert.alert(
      'Duplicar',
      'Duplicar como credencial nueva estará disponible en una próxima versión.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Resolver conflicto</Text>
        <Text style={styles.lead}>
          Otro dispositivo modificó esta credencial antes de que se aplicara tu
          cambio pendiente.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Credencial</Text>
          <Text style={styles.mono}>{entry.itemKey}</Text>
          <Text style={styles.label}>Operación</Text>
          <Text style={styles.value}>{typeLabel}</Text>
          <Text style={styles.label}>Tu versión base (row)</Text>
          <Text style={styles.value}>{baseRv}</Text>
          <Text style={styles.label}>Versión en servidor</Text>
          <Text style={styles.value}>{entry.serverRowVersion}</Text>
        </View>

        <PrimaryButton
          title="Usar versión del servidor"
          onPress={() => void useServer()}
          loading={busy === 'server'}
        />
        <View style={styles.gap} />
        <PrimaryButton
          title="Forzar mi cambio"
          variant="ghost"
          onPress={() => void forceLocal()}
          loading={busy === 'force'}
        />
        <View style={styles.gap} />
        <PrimaryButton
          title="Duplicar como nueva (próximamente)"
          variant="ghost"
          onPress={duplicatePlaceholder}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    gap: spacing.xs,
    ...cardShadow,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  gap: {
    height: spacing.sm,
  },
});
