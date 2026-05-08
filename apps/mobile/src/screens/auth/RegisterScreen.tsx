import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useRegisterMutation } from '@/store/rtk/passtoreApi';
import { persistSession } from '@/features/auth/session';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading }] = useRegisterMutation();

  const onSubmit = async () => {
    try {
      const res = await register({
        email: email.trim(),
        username: username.trim(),
        password,
      }).unwrap();
      await persistSession(res.accessToken, res.user);
    } catch {
      Alert.alert('Error', 'No se pudo crear la cuenta.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Crear cuenta</Text>
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
        placeholder="Nombre de usuario"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 8)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <PrimaryButton title="Registrarme" loading={isLoading} onPress={onSubmit} />
      <Pressable style={styles.switcher} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.switcherText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
  switcher: {
    marginTop: 'auto',
    paddingVertical: spacing.md,
  },
  switcherText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
