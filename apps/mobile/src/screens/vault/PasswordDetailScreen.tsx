import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecurityBadge } from '@/components/SecurityBadge';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import {
  useCredentialQuery,
  useDeleteCredentialMutation,
} from '@/store/rtk/passtoreApi';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { decryptSensitive } from '@/services/encryption/encryptionService';
import { promptBiometric } from '@/services/biometrics/biometricsService';
import { scoreToSecurityIndicator } from '@/utils/passwordStrength';

type Nav = NativeStackNavigationProp<MainStackParamList, 'PasswordDetail'>;
type R = RouteProp<MainStackParamList, 'PasswordDetail'>;

export function PasswordDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { id } = route.params;

  const { data } = useCredentialQuery(id);
  const [deleteCred] = useDeleteCredentialMutation();

  const [revealed, setRevealed] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const decryptPassword = async (): Promise<string | null> => {
    if (!data) {
      return null;
    }
    const key = await SecureStorage.getVaultKey();
    if (!key) {
      Alert.alert('Bóveda', 'No hay clave local disponible.');
      return null;
    }
    try {
      return decryptSensitive(data.encryptedPassword, key);
    } catch {
      Alert.alert('Error', 'No se pudo descifrar la contraseña.');
      return null;
    }
  };

  const onCopy = async () => {
    const plain = await decryptPassword();
    if (!plain) {
      return;
    }
    Clipboard.setString(plain);
    setTimeout(() => Clipboard.setString(''), 45_000);
    Alert.alert('Copiado', 'La contraseña se borrará del portapapeles en ~45s.');
  };

  const onReveal = async () => {
    const ok = await promptBiometric('Desbloquear contraseña');
    if (!ok) {
      return;
    }
    const plain = await decryptPassword();
    if (!plain) {
      return;
    }
    setRevealed(plain);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => setRevealed(null), 12_000);
  };

  const onDelete = () => {
    Alert.alert(
      'Eliminar credencial',
      '¿Seguro que deseas borrar esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCred(id).unwrap();
              navigation.popToTop();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ],
    );
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Cargando...</Text>
      </View>
    );
  }

  const strengthScore = data.strengthScore ?? 72;
  const security = scoreToSecurityIndicator(strengthScore, data.isDuplicate);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.alias}>{data.alias}</Text>
        <Text style={styles.meta}>{data.platformName}</Text>
        <Text style={styles.meta}>{data.loginUsername}</Text>
        {data.url ? <Text style={styles.link}>{data.url}</Text> : null}
        <View style={styles.row}>
          <SecurityBadge status={security} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Contraseña</Text>
        <Text style={styles.secret}>
          {revealed ?? '••••••••••••'}
        </Text>
      </View>

      <PrimaryButton title="Copiar contraseña" onPress={onCopy} />
      <PrimaryButton
        title="Mostrar temporalmente (biometría)"
        variant="ghost"
        onPress={onReveal}
        style={{ marginTop: spacing.sm }}
      />
      <PrimaryButton
        title="Editar"
        variant="ghost"
        onPress={() =>
          navigation.navigate('CreateCredential', { credentialId: id })
        }
        style={{ marginTop: spacing.sm }}
      />
      <Pressable onPress={onDelete} style={styles.deleteWrap}>
        <Text style={styles.delete}>Eliminar credencial</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  muted: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: 6,
    ...cardShadow,
  },
  alias: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  link: {
    color: colors.primarySoft,
    fontSize: 14,
  },
  row: {
    marginTop: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  secret: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  deleteWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  delete: {
    color: colors.danger,
    fontWeight: '600',
  },
});
