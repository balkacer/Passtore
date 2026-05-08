/** Tests en `src/tests/**` únicamente — ver `docs/TESTING.md`. */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@passtore/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@passtore/crypto-contract$':
      '<rootDir>/../../packages/crypto-contract/src/index.ts',
    '^@passtore/vault-crypto$':
      '<rootDir>/../../packages/vault-crypto/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@reduxjs|immer|react-redux|react-native-screens|react-native-gesture-handler|react-native-safe-area-context)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
