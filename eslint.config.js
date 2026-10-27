const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'public/*'],
    rules: {
      // Sheet, toast, and omnibox mount/unmount animations intentionally sync
      // their mounted state inside effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
