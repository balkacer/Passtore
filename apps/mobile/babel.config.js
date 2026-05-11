module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
        },
      },
    ],
    [
      'transform-inline-environment-variables',
      {
        include: [
          'PASSTORE_USE_LOCAL_VAULT',
          'PASSTORE_USE_SYNC_OUTBOX',
          'PASSTORE_USE_SYNC_SOCKET',
        ],
      },
    ],
  ],
};
