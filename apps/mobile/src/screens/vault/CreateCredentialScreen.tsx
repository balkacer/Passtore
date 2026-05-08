import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PasswordGenerator } from '@/features/password-generator/PasswordGenerator';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import {
  useCreateCredentialMutation,
  useCredentialQuery,
  useCredentialsQuery,
  useUpdateCredentialMutation,
} from '@/store/rtk/passtoreApi';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { encryptSensitive } from '@/services/encryption/encryptionService';
import { evaluatePasswordStrength } from '@/utils/passwordStrength';
import { resolveFaviconUrl } from '@/services/favicon/faviconService';
import { isPlainPasswordDuplicate } from '@/utils/vaultDuplicate';

type Nav = NativeStackNavigationProp<MainStackParamList, 'CreateCredential'>;
type Route = RouteProp<MainStackParamList, 'CreateCredential'>;

export function CreateCredentialScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const credentialId = route.params?.credentialId;

  const { data: existing } = useCredentialQuery(credentialId ?? '', {
    skip: !credentialId,
  });
  const { data: all } = useCredentialsQuery();

  const [alias, setAlias] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [url, setUrl] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const [createCred, { isLoading: creating }] = useCreateCredentialMutation();
  const [updateCred, { isLoading: updating }] = useUpdateCredentialMutation();

  useEffect(() => {
    if (existing) {
      setAlias(existing.alias);
      setPlatformName(existing.platformName);
      setUrl(existing.url ?? '');
      setLoginUsername(existing.loginUsername);
      setCategory(existing.category ?? '');
      setIconUrl(existing.iconUrl);
      void (async () => {
        try {
          const key = await SecureStorage.getVaultKey();
          if (!key) {
            return;
          }
          if (existing.notesEncrypted) {
            const { decryptSensitive } = await import(
              '@passtore/vault-crypto'
            );
            setNotes(decryptSensitive(existing.notesEncrypted, key));
          }
        } catch {
          /* ignore */
        }
      })();
    }
  }, [existing]);

  const onBlurUrl = () => {
    const fav = resolveFaviconUrl(url);
    setIconUrl(fav);
  };

  const loading = creating || updating;

  const canSubmit = useMemo(
    () =>
      alias.trim() &&
      platformName.trim() &&
      loginUsername.trim() &&
      (credentialId ? true : password.trim()),
    [alias, credentialId, loginUsername, password, platformName],
  );

  const onSave = async () => {
    if (!canSubmit) {
      return;
    }
    const vaultKey = await SecureStorage.ensureVaultKey();
    const trimPwd = password.trim();
    const strength = evaluatePasswordStrength(trimPwd || 'aaaa');
    const duplicate =
      trimPwd.length > 0
        ? await isPlainPasswordDuplicate(trimPwd, vaultKey, all ?? [], credentialId)
        : false;

    const notesCipher = notes.trim()
      ? encryptSensitive(notes.trim(), vaultKey)
      : undefined;

    try {
      if (credentialId && existing) {
        const patch: Record<string, unknown> = {
          alias: alias.trim(),
          platformName: platformName.trim(),
          url: url.trim() || undefined,
          loginUsername: loginUsername.trim(),
          iconUrl: iconUrl ?? undefined,
          notesEncrypted: notesCipher,
          category: category.trim() || undefined,
          strengthScore: trimPwd ? strength.score : existing.strengthScore ?? undefined,
          isDuplicate: trimPwd ? duplicate : existing.isDuplicate,
        };
        if (trimPwd) {
          patch.encryptedPassword = encryptSensitive(trimPwd, vaultKey);
        }
        await updateCred({
          id: credentialId,
          patch: patch as never,
        }).unwrap();
      } else {
        const encryptedPassword = encryptSensitive(trimPwd, vaultKey);
        await createCred({
          alias: alias.trim(),
          platformName: platformName.trim(),
          url: url.trim() || undefined,
          loginUsername: loginUsername.trim(),
          encryptedPassword,
          iconUrl: iconUrl ?? undefined,
          notesEncrypted: notesCipher,
          strengthScore: strength.score,
          isDuplicate: duplicate,
          category: category.trim() || undefined,
        }).unwrap();
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la credencial.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Alias</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Banco personal"
        placeholderTextColor={colors.textMuted}
        value={alias}
        onChangeText={setAlias}
      />

      <Text style={styles.label}>Plataforma / app</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del servicio"
        placeholderTextColor={colors.textMuted}
        value={platformName}
        onChangeText={setPlatformName}
      />

      <Text style={styles.label}>URL del sitio</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={url}
        onChangeText={setUrl}
        onBlur={onBlurUrl}
      />

      <Text style={styles.label}>Usuario o email</Text>
      <TextInput
        style={styles.input}
        placeholder="usuario@correo.com"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={loginUsername}
        onChangeText={setLoginUsername}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder={credentialId ? 'Dejar vacío para no cambiar' : '••••••••'}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.section}>Generador</Text>
      <PasswordGenerator onUsePassword={setPassword} />

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas privadas"
        placeholderTextColor={colors.textMuted}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <Text style={styles.label}>Categoría (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Finanzas, redes..."
        placeholderTextColor={colors.textMuted}
        value={category}
        onChangeText={setCategory}
      />

      <PrimaryButton
        title={credentialId ? 'Guardar cambios' : 'Guardar credencial'}
        loading={loading}
        onPress={onSave}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  label: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    ...cardShadow,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
