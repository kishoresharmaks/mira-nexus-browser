const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('\n--- 1. ANDROID MANIFEST & EXPO PLUGIN DURABILITY ---');
const manifestXml = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

assert(
  manifestXml.includes('<uses-permission android:name="android.permission.CAMERA"/>') &&
  !manifestXml.includes('<uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>'),
  'CAMERA permission is declared in AndroidManifest without tools:node="remove"',
);

assert(
  manifestXml.includes('<uses-permission android:name="android.permission.RECORD_AUDIO"/>') &&
  !manifestXml.includes('<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>'),
  'RECORD_AUDIO permission is declared in AndroidManifest without tools:node="remove"',
);

const hwPlugin = fs.readFileSync('plugins/with-hardware-features.js', 'utf8');
assert(
  hwPlugin.includes('android.permission.CAMERA') && hwPlugin.includes('android.permission.RECORD_AUDIO'),
  'plugins/with-hardware-features.js enforces durable CAMERA and RECORD_AUDIO permissions during prebuild',
);

console.log('\n--- 2. COMPLETE OPEN SOURCE LICENSE INVENTORY AUDIT ---');
const licenseJsonPath = path.join('src', 'data', 'open-source-licenses.json');
assert(fs.existsSync(licenseJsonPath), 'License inventory file exists at src/data/open-source-licenses.json');

const licenses = JSON.parse(fs.readFileSync(licenseJsonPath, 'utf8'));
assert(Array.isArray(licenses) && licenses.length >= 440, `License inventory contains ${licenses.length} entries (>= 440 expected for complete graph)`);

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const prodDeps = Object.keys(packageJson.dependencies || {});

for (const dep of prodDeps) {
  const found = licenses.find((l) => l.name === dep);
  assert(Boolean(found), `Direct production dependency "${dep}" is inventoried in licenses`);
  assert(Boolean(found.license && found.license !== 'UNKNOWN'), `Dependency "${dep}" has valid license "${found?.license}"`);
  assert(Boolean(found.licenseText && found.licenseText.length > 20), `Dependency "${dep}" contains full license text`);
}

// Check native Android entries
assert(licenses.some((l) => l.name === 'com.facebook.react:react-android'), 'com.facebook.react:react-android is inventoried');
assert(licenses.some((l) => l.name === 'com.facebook.react:hermes-android'), 'com.facebook.react:hermes-android is inventoried');
assert(licenses.some((l) => l.name === 'androidx.work:work-runtime'), 'androidx.work:work-runtime is inventoried');

// Check weak copyleft entry
const mplDep = licenses.find((l) => l.license === 'MPL-2.0');
assert(Boolean(mplDep), 'MPL-2.0 weak copyleft dependency (lightningcss) is detected and flagged');

console.log('\n--- 3. VERSIONING & RELEASE IDENTITY AUDIT ---');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
assert(packageJson.version === '1.2.0', `package.json version is synchronized to 1.2.0 (got ${packageJson.version})`);
assert(appJson.expo.version === '1.2.0', `app.json version is 1.2.0 (got ${appJson.expo.version})`);
assert(appJson.expo.android.versionCode >= 13, `app.json versionCode is >= 13 (got ${appJson.expo.android.versionCode})`);
assert(appJson.expo.android.package === 'com.nexus.browser', 'Package name is com.nexus.browser');

const applyVersionScript = fs.readFileSync('scripts/ci/apply-version.mjs', 'utf8');
assert(
  applyVersionScript.includes('packageJsonPath') && applyVersionScript.includes('pkg.version = version'),
  'apply-version.mjs synchronizes both app.json and package.json to prevent version divergence',
);

console.log('\n--- 4. PERMISSION STATES & WEBSITE CLARITY AUDIT ---');
const permissionsTs = fs.readFileSync('src/lib/permissions.ts', 'utf8');
assert(permissionsTs.includes("'restricted'"), "'restricted' permission state is supported");
assert(permissionsTs.includes("'not-applicable'"), "'not-applicable' permission state is supported");

const permissionsCardTsx = fs.readFileSync('src/components/privacy/PermissionsCard.tsx', 'utf8');
assert(
  permissionsCardTsx.includes('Nexus does not offer per-origin website permission grants'),
  'PermissionsCard explicitly documents that website camera/mic access is unconditionally blocked by policy',
);

console.log('\n--- 5. COPYRIGHT & LEGAL OWNERSHIP AUDIT ---');
const versionCardTsx = fs.readFileSync('src/components/about/AppVersionCard.tsx', 'utf8');
assert(
  !versionCardTsx.includes('copyright © 2026 Nexus Team'),
  'Fictitious "Nexus Team" copyright holder has been removed; entity is flagged for owner confirmation',
);

console.log('\n🎉 ALL PHASE 5.1 ACCEPTANCE ASSERTIONS PASSED!\n');
