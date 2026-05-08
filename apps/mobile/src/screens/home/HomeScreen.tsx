import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { PasstoreLogo } from '@/components/PasstoreLogo';
import { CredentialCard } from '@/components/CredentialCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useAuthStore } from '@/store/zustand/authStore';
import {
  useCredentialsQuery,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
} from '@/store/rtk/passtoreApi';
import type { CredentialDto } from '@passtore/core';
import { logoutSession } from '@/features/auth/session';
import { useConflictStore } from '@/store/zustand/conflictStore';
import { Passkey } from 'react-native-passkey';
import {
  mapCreateResultToApi,
  toPasskeyCreateRequest,
} from '@/services/passkeys/mapNativePasskey';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const conflicts = useConflictStore((s) => s.conflicts);
  const { data, refetch, isFetching } = useCredentialsQuery();
  const [regOpt, { isLoading: pkRegOpt }] = usePasskeyRegisterOptionsMutation();
  const [regVer, { isLoading: pkRegVer }] = usePasskeyRegisterVerifyMutation();

  const registerPasskey = async () => {
    if (!Passkey.isSupported()) {
      Alert.alert('Passkeys', 'No soportado en este dispositivo.');
      return;
    }
    try {
      const opts = await regOpt().unwrap();
      const req = toPasskeyCreateRequest(opts);
      const created = await Passkey.create(req);
      const body = mapCreateResultToApi(created);
      await regVer({ response: body }).unwrap();
      Alert.alert('Listo', 'Passkey registrada en este dispositivo.');
    } catch (e) {
      console.warn(e);
      Alert.alert(
        'Passkey',
        'No se pudo registrar. Revisa RP_ID / URL del servidor en README.',
      );
    }
  };

  const recent = (data ?? []).slice(0, 12);

  const weakCount = (data ?? []).filter(
    (c) => (c.strengthScore ?? 100) < 45 && !c.isDuplicate,
  ).length;
  const dupCount = (data ?? []).filter((c) => c.isDuplicate).length;

  const tips = [
    dupCount > 0 && 'Tienes contraseñas duplicadas — únicas por servicio.',
    weakCount > 0 && 'Algunas claves son débiles — usa el generador.',
    'Revisa contraseñas antiguas con regularidad.',
    'Evita reutilizar claves entre sitios.',
  ].filter(Boolean) as string[];

  const renderItem = ({ item }: { item: CredentialDto }) => (
    <CredentialCard
      item={item}
      onPress={() => navigation.navigate('PasswordDetail', { id: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PasstoreLogo size={44} />
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.name}>{user?.username ?? 'Passtore'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={registerPasskey} hitSlop={8} disabled={pkRegOpt || pkRegVer}>
            <Text style={styles.pkBtn}>＋Passkey</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SecurityTempAuth')} hitSlop={8}>
            <Text style={styles.pkBtn}>Seguridad</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconBtn}
            hitSlop={8}>
            <Text style={styles.iconTxt}>🔔</Text>
          </Pressable>
          <Pressable onPress={() => logoutSession()} hitSlop={8}>
            <Text style={styles.logout}>Salir</Text>
          </Pressable>
        </View>
      </View>

      {conflicts.length > 0 && (
        <Pressable
          style={styles.conflictBanner}
          onPress={() => navigation.navigate('ConflictList')}
          hitSlop={4}>
          <Text style={styles.conflictBannerText}>
            {conflicts.length === 1
              ? 'Conflicto de sincronización — toca para ver y resolver'
              : `${conflicts.length} conflictos de sincronización — toca para ver la lista`}
          </Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Recientes</Text>
      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aún no hay credenciales. Crea la primera con el botón flotante.
          </Text>
        }
      />

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
        {tips.map((t) => (
          <View key={t} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{t}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCredential', {})}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  conflictBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentCoral,
  },
  conflictBannerText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 13,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconBtn: {
    padding: 6,
  },
  iconTxt: {
    fontSize: 20,
  },
  pkBtn: {
    color: colors.primarySoft,
    fontWeight: '700',
    fontSize: 13,
  },
  logout: {
    color: colors.primarySoft,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  tips: {
    marginBottom: 96,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  tipsTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.accentCoral,
  },
  tipText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    marginTop: -2,
  },
});
