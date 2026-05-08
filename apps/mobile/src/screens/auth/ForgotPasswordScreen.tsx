import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cardShadow } from '@/theme/shadows';
import { useForgotPasswordMutation } from '@/store/rtk/passtoreApi';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [forgot, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async () => {
    try {
      const res = await forgot({ email: email.trim() }).unwrap();
      Alert.alert('Listo', res.message);
    } catch {
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recuperar acceso</Text>
      <Text style={styles.copy}>
        Enviaremos instrucciones si existe una cuenta asociada (mock en MVP).
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <PrimaryButton title="Enviar enlace" loading={isLoading} onPress={onSubmit} />
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
    marginBottom: spacing.sm,
  },
  copy: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
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
});
