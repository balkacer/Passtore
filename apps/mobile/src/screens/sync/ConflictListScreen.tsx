import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useConflictStore, type SyncConflictEntry } from '@/store/zustand/conflictStore';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ConflictList'>;

function typeLabel(entry: SyncConflictEntry): string {
  return entry.payload.type === 'VAULT_ITEM_DELETE' ? 'Eliminar' : 'Guardar';
}

export function ConflictListScreen() {
  const navigation = useNavigation<Nav>();
  const conflicts = useConflictStore((s) => s.conflicts);

  const sorted = [...conflicts].sort((a, b) =>
    a.itemKey.localeCompare(b.itemKey, undefined, { sensitivity: 'base' }),
  );

  if (sorted.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Sin conflictos pendientes</Text>
          <Text style={styles.emptyLead}>
            Si acabas de resolver uno, los cambios ya están aplicados.
          </Text>
          <PrimaryButton title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.lead}>
            Elige un elemento para decidir si mantienes tu cambio o la versión
            del servidor.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('ConflictResolution', { conflictId: item.id })
            }
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={styles.rowMain}>
              <Text style={styles.itemKey} numberOfLines={1}>
                {item.itemKey}
              </Text>
              <Text style={styles.meta}>
                {typeLabel(item)} · servidor v{item.serverRowVersion}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  itemKey: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyLead: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
