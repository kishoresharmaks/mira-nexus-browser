const fs = require('fs');
const path = require('path');
const withHardwareFeatures = require('../plugins/with-hardware-features');
const withWebViewHardening = require('../plugins/with-webview-hardening');

console.log('--- EXPO CONFIG PLUGIN MANIFEST PIPELINE AUDIT ---');

const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const manifestXml = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

// Parse basic manifest tags
const usesPermissions = [];
const usesFeatures = [];

const permRegex = /<uses-permission\s+([^>]+)\/>/g;
let m;
while ((m = permRegex.exec(manifestXml)) !== null) {
  const attrs = m[1];
  const nameMatch = attrs.match(/android:name="([^"]+)"/);
  const nodeMatch = attrs.match(/tools:node="([^"]+)"/);
  if (nameMatch) {
    usesPermissions.push({
      name: nameMatch[1],
      node: nodeMatch ? nodeMatch[1] : undefined,
    });
  }
}

console.log(`Audited ${usesPermissions.length} permissions in base manifest.`);

// Verify CAMERA and RECORD_AUDIO
const camera = usesPermissions.find(p => p.name === 'android.permission.CAMERA');
const mic = usesPermissions.find(p => p.name === 'android.permission.RECORD_AUDIO');

console.log('Camera node status:', camera ? (camera.node || 'normal') : 'missing');
console.log('Microphone node status:', mic ? (mic.node || 'normal') : 'missing');

if (camera && camera.node === 'remove') {
  console.error('❌ CAMERA is marked with tools:node="remove"');
  process.exit(1);
}
if (mic && mic.node === 'remove') {
  console.error('❌ RECORD_AUDIO is marked with tools:node="remove"');
  process.exit(1);
}

// Check blocked permissions
const blocked = appJson.expo.android.blockedPermissions || [];
for (const b of blocked) {
  const found = usesPermissions.find(p => p.name === b);
  if (found) {
    if (found.node !== 'remove') {
      console.warn(`⚠️ Blocked permission ${b} exists without tools:node="remove"`);
    } else {
      console.log(`✅ ${b.replace('android.permission.', '')} is blocked via tools:node="remove"`);
    }
  }
}

// Test plugin mock execution
const mockManifestConfig = {
  modResults: {
    manifest: {
      $: {},
      application: [
        {
          'meta-data': []
        }
      ],
      'uses-feature': [],
      'uses-permission': [
        { $: { 'android:name': 'android.permission.CAMERA', 'tools:node': 'remove' } },
        { $: { 'android:name': 'android.permission.RECORD_AUDIO', 'tools:node': 'remove' } }
      ]
    }
  }
};

async function run() {
  const configWithMod = withHardwareFeatures({ ...appJson, mods: {} });
  const pluginAction = configWithMod.mods.android.manifest;
  const processed = await pluginAction(mockManifestConfig);
  const fixedCamera = processed.modResults.manifest['uses-permission'].find(p => p.$['android:name'] === 'android.permission.CAMERA');
  const fixedMic = processed.modResults.manifest['uses-permission'].find(p => p.$['android:name'] === 'android.permission.RECORD_AUDIO');

  if (fixedCamera.$['tools:node'] === 'remove' || fixedMic.$['tools:node'] === 'remove') {
    console.error('❌ withHardwareFeatures failed to strip tools:node="remove"');
    process.exit(1);
  }
  console.log('✅ withHardwareFeatures config plugin successfully stripped tools:node="remove" and protected runtime permissions.');

  console.log('🎉 MANIFEST AUDIT COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
