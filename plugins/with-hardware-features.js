const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Ensures non-essential hardware features are marked as optional (`android:required="false"`)
 * in the AndroidManifest so Google Play does not restrict app availability on tablets,
 * desktops, Chromebooks, and Android XR devices.
 */
const OPTIONAL_FEATURES = [
  'android.hardware.screen.portrait',
  'android.hardware.screen.landscape',
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
  'android.hardware.microphone',
];

module.exports = function withHardwareFeatures(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    if (!manifest) return manifestConfig;

    manifest.$ = manifest.$ ?? {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    manifest['uses-feature'] = manifest['uses-feature'] ?? [];

    for (const featureName of OPTIONAL_FEATURES) {
      const existing = manifest['uses-feature'].find(
        (item) => item?.$?.['android:name'] === featureName,
      );

      if (existing) {
        existing.$ = existing.$ ?? {};
        existing.$['android:required'] = 'false';
        existing.$['tools:replace'] = 'android:required';
      } else {
        manifest['uses-feature'].push({
          $: {
            'android:name': featureName,
            'android:required': 'false',
            'tools:replace': 'android:required',
          },
        });
      }
    }

    // Ensure CAMERA and RECORD_AUDIO permissions survive configuration regeneration without tools:node="remove"
    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    const runtimePermissions = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ];

    for (const permName of runtimePermissions) {
      const existing = manifest['uses-permission'].find(
        (item) => item?.$?.['android:name'] === permName,
      );

      if (existing) {
        if (existing.$?.['tools:node'] === 'remove') {
          delete existing.$['tools:node'];
        }
      } else {
        manifest['uses-permission'].push({
          $: {
            'android:name': permName,
          },
        });
      }
    }

    return manifestConfig;
  });
};
