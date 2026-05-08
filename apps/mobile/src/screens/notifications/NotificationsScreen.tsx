import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useCredentialsQuery } from '@/store/rtk/passtoreApi';

export function NotificationsScreen() {
  const { data } = useCredentialsQuery();

  const weak = (data ?? []).filter((c) => (c.strengthScore ?? 100) < 45);
  const dup = (data ?? []).filter((c) => c.isDuplicate);
  const old = (data ?? []).filter((c) => {
    const created = new Date(c.createdAt).getTime();
    return Date.now() - created > 1000 * 60 * 60 * 24 * 180;
  });

  const items = [
    ...weak.map((c) => ({
      key: `w-${c.id}`,
      title: 'Contraseña débil',
      body: `${c.alias} podría fortalecerse.`,
    })),
    ...dup.map((c) => ({
      key: `d-${c.id}`,
      title: 'Posible duplicada',
      body: `${c.alias} comparte la misma clave que otra entrada.`,
    })),
    ...old.map((c) => ({
      key: `o-${c.id}`,
      title: 'Antigua',
      body: `${c.alias} lleva tiempo sin actualizarse.`,
    })),
    {
      key: 'tip',
      title: 'Recomendación',
      body: 'Activa Face ID / huella para ver contraseñas con mayor seguridad.',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Centro de seguridad</Text>
      <Text style={styles.sub}>
        Alertas derivadas de tus datos locales (mock ampliado en futuras versiones).
      </Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Todo en orden por ahora.</Text>
      ) : (
        items.map((n) => (
          <View key={n.key} style={styles.card}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.body}>{n.body}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sub: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  empty: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    gap: 6,
    ...cardShadow,
  },
  title: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
