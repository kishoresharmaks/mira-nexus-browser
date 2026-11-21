const { withAndroidManifest } = require('expo/config-plugins');

/**
 * WebView hardening that has to live in the AndroidManifest.
 *
 * - EnableSafeBrowsing: keep Google's malware and phishing interstitial on.
 * - MetricsOptOut: tell WebView not to report anonymous usage metrics to
 *   Google. Nexus promises no analytics, and that promise includes the engine.
 *
 * Both are explicit rather than relying on platform defaults, which vary by
 * Android version and OEM.
 */
const META_DATA = [
  { name: 'android.webkit.WebView.EnableSafeBrowsing', value: 'true' },
  { name: 'android.webkit.WebView.MetricsOptOut', value: 'true' },
];

module.exports = function withWebViewHardening(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (!application) return manifestConfig;

    application['meta-data'] = application['meta-data'] ?? [];

    for (const entry of META_DATA) {
      const exists = application['meta-data'].some(
        (item) => item?.$?.['android:name'] === entry.name,
      );
      if (exists) continue;

      application['meta-data'].push({
        $: {
          'android:name': entry.name,
          'android:value': entry.value,
        },
      });
    }

    return manifestConfig;
  });
};
