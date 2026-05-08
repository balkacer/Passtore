import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Passkey } from 'react-native-passkey';
import type { AuthStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import {
  useLoginMutation,
  usePasskeyLoginOptionsMutation,
  usePasskeyLoginVerifyMutation,
} from '@/store/rtk/passtoreApi';
import { persistSession } from '@/features/auth/session';
import {
  mapGetResultToApi,
  toPasskeyGetRequest,
} from '@/services/passkeys/mapNativePasskey';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [pkUsername, setPkUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [pkOpts, { isLoading: pkOptLoading }] = usePasskeyLoginOptionsMutation();
  const [pkVerify, { isLoading: pkVerLoading }] = usePasskeyLoginVerifyMutation();

  const onPasskeyLogin = async () => {
    const u = pkUsername.trim();
    if (!u) {
      Alert.alert('Usuario', 'Introduce tu nombre de usuario.');
      return;
    }
    if (!Passkey.isSupported()) {
      Alert.alert(
        'Passkeys',
        'Passkeys no disponibles en este dispositivo o versión de OS.',
      );
      return;
    }
    try {
      const optionsRecord = await pkOpts({ username: u }).unwrap();
      const req = toPasskeyGetRequest(optionsRecord);
      const nativeResult = await Passkey.get(req);
      const responsePayload = mapGetResultToApi(nativeResult);
      const res = await pkVerify({
        username: u,
        response: responsePayload,
      }).unwrap();
      await persistSession(res.accessToken, res.user);
    } catch (e) {
      console.warn(e);
      Alert.alert(
        'Passkey',
        'No se pudo autenticar. ¿Registraste una passkey en Home? RP_ID y URL del API deben coincidir (ver README).',
      );
    }
  };

  const onSubmit = async () => {
    try {
      const res = await login({ email: email.trim(), password }).unwrap();
      await persistSession(res.accessToken, res.user);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar sesión. Revisa tus datos.');
    }
  };

  const onGoogle = () => {
    Alert.alert(
      'Google Sign-In',
      'Configura @react-native-google-signin/google-signin (webClientId, URL schemes). Ver README.',
    );
  };

  const onApple = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign-In', 'Disponible en dispositivos Apple.');
      return;
    }
    Alert.alert(
      'Apple Sign-In',
      'Habilita Sign In with Apple en Xcode y enlaza el backend. Ver README.',
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Iniciar sesión</Text>

      <Text style={styles.sub}>Solo con passkey (usuario)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={pkUsername}
        onChangeText={setPkUsername}
      />
      <PrimaryButton
        title="Entrar con passkey"
        loading={pkOptLoading || pkVerLoading}
        onPress={onPasskeyLogin}
      />

      <Text style={styles.or}>o con email y contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </Pressable>
      <PrimaryButton title="Entrar" loading={isLoading} onPress={onSubmit} />

      <Text style={styles.or}>o continúa con</Text>
      <PrimaryButton title="Google" variant="ghost" onPress={onGoogle} />
      {Platform.OS === 'ios' ? (
        <PrimaryButton title="Apple" variant="ghost" onPress={onApple} />
      ) : null}

      <Pressable style={styles.switcher} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.switcherText}>¿No tienes cuenta? Crear una</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.sm,
    flexGrow: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  link: {
    color: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  or: {
    textAlign: 'center',
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  switcher: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  switcherText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
