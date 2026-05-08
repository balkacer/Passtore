import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { PasstoreLogo } from '@/components/PasstoreLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const BENEFITS = [
  'Guarda contraseñas de forma segura',
  'Genera contraseñas fuertes al instante',
  'Protege el acceso con biometría',
  'Detecta duplicadas y claves débiles',
];

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <PasstoreLogo size={72} />
        <Text style={styles.title}>Passtore</Text>
        <Text style={styles.subtitle}>
          Tu bóveda minimalista para credenciales, passkeys y accesos web.
        </Text>
      </View>

      <View style={styles.list}>
        {BENEFITS.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <View style={styles.dot} />
            <Text style={styles.bullet}>{line}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton title="Crear cuenta" onPress={() => navigation.navigate('Register')} />
      <PrimaryButton
        title="Iniciar sesión"
        variant="ghost"
        onPress={() => navigation.navigate('Login')}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.accentCoral,
  },
  bullet: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
