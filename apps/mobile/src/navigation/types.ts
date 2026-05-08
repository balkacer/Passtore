export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  CreateCredential: { credentialId?: string } | undefined;
  PasswordDetail: { id: string };
  Notifications: undefined;
  ConflictList: undefined;
  ConflictResolution: { conflictId: string };
  TempAuthPairing: { sessionId: string; pairingCode: string };
  TempAuthDelivery: { requestId: string };
  /** Sesiones temporales, auditoría local y ampliaciones de seguridad. */
  SecurityTempAuth: undefined;
};
