import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import {
  useRevokeAllTemporarySessionsMutation,
  useRevokeTemporarySessionMutation,
  useTemporaryAuthSessionsQuery,
} from '@/store/rtk/passtoreApi';
import type { TemporaryAuthSessionDto } from '@/store/rtk/passtoreApi';
import {
  clearTempAuthAudit,
  listTempAuthAudit,
  type TempAuthLocalAuditEntry,
} from '@/services/temp-auth/tempAuthLocalAudit';

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Activa',
    pending_pairing: 'Esperando pareo',
    revoked: 'Revocada',
    expired: 'Expirada',
  };
  return map[status] ?? status;
}

function contextLabel(ctx: string): string {
  const map: Record<string, string> = {
    browser: 'Navegador',
    extension: 'Extensión',
    autofill: 'Autofill',
    desktop: 'Escritorio',
    web: 'Web',
  };
  return map[ctx] ?? ctx;
}

export function SecurityTempAuthScreen() {
  const { data: sessions, refetch, isFetching, isLoading, error } =
    useTemporaryAuthSessionsQuery();
  const [revokeOne, { isLoading: revokingOne }] = useRevokeTemporarySessionMutation();
  const [revokeAll, { isLoading: revokingAll }] = useRevokeAllTemporarySessionsMutation();

  const [localAudit, setLocalAudit] = useState<TempAuthLocalAuditEntry[]>([]);

  const loadLocal = useCallback(async () => {
    const rows = await listTempAuthAudit();
    setLocalAudit(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadLocal();
    }, [loadLocal]),
  );

  const onRevokeSession = (s: TemporaryAuthSessionDto) => {
    Alert.alert(
      'Revocar sesión',
      `¿Cerrar acceso para «${s.requestingDeviceName}» (${s.allowedOrigin})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: () => void revokeOne({ sessionId: s.id }).unwrap().catch(console.warn),
        },
      ],
    );
  };

  const onRevokeAll = () => {
    Alert.alert(
      'Cerrar todas',
      'Se revocarán todas las sesiones temporales activas en el servidor.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar todas',
          style: 'destructive',
          onPress: () =>
            void revokeAll()
              .unwrap()
              .then(() => refetch())
              .catch(console.warn),
        },
      ],
    );
  };

  const onClearLocalAudit = () => {
    Alert.alert(
      'Borrar registro local',
      'Solo elimina el historial en este dispositivo. La auditoría del servidor no cambia.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () =>
            void clearTempAuthAudit().then(() => {
              void loadLocal();
            }),
        },
      ],
    );
  };

  const activeSessions = (sessions ?? []).filter((s) => s.status === 'active');
  const otherSessions = (sessions ?? []).filter((s) => s.status !== 'active');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }>
        <Text style={styles.lead}>
          Controla accesos temporales (navegador, extensión, autofill) y revisa qué aprobaste en
          este teléfono.
        </Text>

        <Text style={styles.sectionTitle}>Sesiones en el servidor</Text>
        {isLoading && (
          <View style={styles.centerRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {error && (
          <Text style={styles.errorText}>No se pudieron cargar las sesiones. Tira para refrescar.</Text>
        )}
        {!isLoading && activeSessions.length === 0 && (
          <Text style={styles.muted}>No hay sesiones temporales activas.</Text>
        )}
        {activeSessions.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{s.requestingDeviceName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(s.status)}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>{contextLabel(s.contextType)} · {s.allowedOrigin}</Text>
            <Text style={styles.cardMeta}>Expira · {formatWhen(s.expiresAt)}</Text>
            <Text style={styles.cardMeta}>
              Entregas · {s.deliveryCount}
              {typeof s.permissions?.maxDeliveries === 'number'
                ? ` / ${String(s.permissions.maxDeliveries)}`
                : ''}
            </Text>
            <Pressable
              style={[styles.dangerBtn, revokingOne && styles.btnDisabled]}
              onPress={() => onRevokeSession(s)}
              disabled={revokingOne}>
              <Text style={styles.dangerBtnText}>Revocar esta sesión</Text>
            </Pressable>
          </View>
        ))}

        {otherSessions.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Historial reciente</Text>
            {otherSessions.slice(0, 8).map((s) => (
              <View key={s.id} style={styles.cardMuted}>
                <Text style={styles.cardTitleSmall}>{s.requestingDeviceName}</Text>
                <Text style={styles.cardMeta}>
                  {statusLabel(s.status)} · {formatWhen(s.expiresAt)}
                </Text>
              </View>
            ))}
          </>
        )}

        <Pressable
          style={[styles.secondaryBtn, (revokingAll || activeSessions.length === 0) && styles.btnDisabled]}
          onPress={onRevokeAll}
          disabled={revokingAll || activeSessions.length === 0}>
          <Text style={styles.secondaryBtnText}>Cerrar todas las sesiones activas</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Registro en este dispositivo</Text>
        <Text style={styles.mutedSmall}>
          Acciones de aprobación y errores guardados solo aquí (complementa la auditoría del
          servidor).
        </Text>
        {localAudit.length === 0 ? (
          <Text style={styles.muted}>Sin entradas locales todavía.</Text>
        ) : (
          localAudit.slice(0, 40).map((row, i) => (
            <View key={`${row.at}-${i}`} style={styles.auditRow}>
              <Text style={styles.auditTime}>{formatWhen(row.at)}</Text>
              <Text style={styles.auditAction}>{row.action}</Text>
            </View>
          ))
        )}
        <Pressable style={styles.ghostBtn} onPress={onClearLocalAudit}>
          <Text style={styles.ghostBtnText}>Borrar registro local</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Ampliar esta pantalla</Text>
        <View style={styles.ideasCard}>
          <Text style={styles.ideaItem}>
            • Notificaciones push cuando llegue una solicitud de credencial sensible (
            <Text style={styles.ideaEm}>approvalDeepLink</Text> sin abrir la app manualmente).
          </Text>
          <Text style={styles.ideaItem}>
            • Preferencias de usuario: TTL por defecto de sesiones temporales, límites de entregas y
            permisos por defecto al iniciar pairing (requiere API de preferencias).
          </Text>
          <Text style={styles.ideaItem}>
            • Reglas por dominio guardadas (lista de orígenes de confianza / bloqueados) en servidor o
            dispositivo.
          </Text>
          <Text style={styles.ideaItem}>
            • Forzar biometría para cada entrega (no solo copy/reveal), como toggle de política.
          </Text>
          <Text style={styles.ideaItem}>
            • Exportar auditoría local / enlazar al log remoto{' '}
            <Text style={styles.ideaEm}>GET /temporary-auth/sessions/:id/audit</Text>.
          </Text>
          <Text style={styles.ideaItem}>
            • Dispositivos registrados y revocación desde la misma zona de seguridad (
            <Text style={styles.ideaEm}>registered_devices</Text>).
          </Text>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  mutedSmall: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  centerRow: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...cardShadow,
  },
  cardMuted: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.roseLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerBtn: {
    marginTop: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentCoral,
  },
  dangerBtnText: {
    color: colors.wine,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  auditRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
  },
  auditTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  auditAction: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 2,
  },
  ghostBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  ghostBtnText: {
    color: colors.primarySoft,
    fontWeight: '600',
    fontSize: 14,
  },
  ideasCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    marginBottom: spacing.lg,
  },
  ideaItem: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  ideaEm: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
