import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TemporaryAuthService } from './temporary-auth.service';
import { TemporaryCredentialRequestPurpose } from './temporary-auth.enums';

function createService(pepper = 'test-pepper') {
  const config = {
    get: jest.fn(<T>(key: string, defaultValue?: T) => {
      if (key === 'TEMPORARY_PAIRING_PEPPER') {
        return pepper;
      }
      return defaultValue as T;
    }),
  } as unknown as ConfigService;

  return new TemporaryAuthService(
    config,
    {} as JwtService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe('TemporaryAuthService', () => {
  describe('hashPairingCode', () => {
    it('is stable for same inputs', () => {
      const s = createService();
      expect(s.hashPairingCode('pair-secret')).toBe(s.hashPairingCode('pair-secret'));
    });

    it('changes when pepper changes', () => {
      const a = createService('a').hashPairingCode('x');
      const b = createService('b').hashPairingCode('x');
      expect(a).not.toBe(b);
    });
  });

  describe('originsCompatible', () => {
    it('allows same hostname', () => {
      const s = createService();
      expect(s.originsCompatible('https://ex.com', 'https://ex.com/path')).toBe(true);
    });

    it('allows subdomain vs apex when suffix matches', () => {
      const s = createService();
      expect(s.originsCompatible('https://sub.ex.com', 'https://ex.com')).toBe(true);
    });
  });

  describe('purposeAllowed / needsBiometricGate', () => {
    it('rejects copy when allowCopy is false', () => {
      const s = createService();
      const perm = s.defaultPermissions({ allowCopy: false });
      expect(s.purposeAllowed(perm, TemporaryCredentialRequestPurpose.COPY)).toBe(false);
    });

    it('gates copy/reveal when requireBiometricPerSensitiveRequest', () => {
      const s = createService();
      const perm = s.defaultPermissions({ allowCopy: true });
      expect(s.needsBiometricGate(perm, TemporaryCredentialRequestPurpose.COPY)).toBe(true);
      expect(s.needsBiometricGate(perm, TemporaryCredentialRequestPurpose.AUTOFILL)).toBe(false);
    });
  });
});
