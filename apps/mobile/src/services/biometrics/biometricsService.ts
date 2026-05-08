import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export async function isBiometricAvailable(): Promise<boolean> {
  const { available } = await rnBiometrics.isSensorAvailable();
  return available;
}

export async function promptBiometric(message: string): Promise<boolean> {
  const { success } = await rnBiometrics.simplePrompt({
    promptMessage: message,
    cancelButtonText: 'Cancel',
  });
  return success;
}
