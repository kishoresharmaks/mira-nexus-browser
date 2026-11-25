#!/usr/bin/env node
/**
 * Optionally adds a real release keystore to the generated Android project.
 *
 * With no `ANDROID_KEYSTORE_BASE64`, Expo's template keeps signing release
 * APKs with its debug key. That is fine for sideloaded tester builds, and the
 * workflow labels the artifact accordingly. When the four signing secrets are
 * present, this script decodes the keystore and points the `release` build type
 * at it. Passwords are read by Gradle from the environment at build time, so
 * they are never written to disk.
 */
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = [
  'ANDROID_KEYSTORE_BASE64',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
];

function fail(message) {
  console.error(`configure-signing: ${message}`);
  process.exit(1);
}

const supplied = REQUIRED.filter((name) => (process.env[name] ?? '').trim());
if (supplied.length === 0) {
  console.log(
    'configure-signing: no keystore secrets; release APK will use the Expo debug key.',
  );
  process.exit(0);
}
if (supplied.length !== REQUIRED.length) {
  const missing = REQUIRED.filter((name) => !(process.env[name] ?? '').trim());
  fail(`incomplete signing configuration; missing ${missing.join(', ')}`);
}

const androidDir = join(process.cwd(), 'android');
const gradlePath = join(androidDir, 'app', 'build.gradle');
const keystorePath = join(androidDir, 'app', 'release.keystore');
if (!existsSync(gradlePath)) {
  fail('android/app/build.gradle is missing; run expo prebuild first');
}

let keystore;
try {
  keystore = Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, 'base64');
} catch {
  fail('ANDROID_KEYSTORE_BASE64 is not valid base64');
}
if (keystore.length < 1_000) {
  fail('decoded keystore is suspiciously small; check ANDROID_KEYSTORE_BASE64');
}
writeFileSync(keystorePath, keystore, { mode: 0o600 });
try {
  chmodSync(keystorePath, 0o600);
} catch {
  // Windows development machines may not support chmod. CI runs on Linux.
}

let gradle = readFileSync(gradlePath, 'utf8');

if (!gradle.includes('signingConfigs.release')) {
  const marker = '    signingConfigs {';
  if (!gradle.includes(marker)) {
    fail('could not find the signingConfigs block in android/app/build.gradle');
  }
  gradle = gradle.replace(
    marker,
    `${marker}
        release {
            storeFile file('release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }`,
  );
}

// Only look inside `buildTypes`: the `signingConfigs` block also starts a
// `release {` section, and matching from there would retarget the debug build.
const buildTypesIndex = gradle.indexOf('buildTypes {');
if (buildTypesIndex === -1) {
  fail('could not find the buildTypes block in android/app/build.gradle');
}
const beforeBuildTypes = gradle.slice(0, buildTypesIndex);
let buildTypes = gradle.slice(buildTypesIndex);
if (!/release\s*\{[\s\S]*?signingConfig signingConfigs\.release/.test(buildTypes)) {
  const patched = buildTypes.replace(
    /(\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    '$1signingConfig signingConfigs.release',
  );
  if (patched === buildTypes) {
    fail('could not switch the release build type to the release keystore');
  }
  buildTypes = patched;
}
gradle = beforeBuildTypes + buildTypes;

writeFileSync(gradlePath, gradle, 'utf8');
console.log(
  `configure-signing: release APK will be signed with alias ${process.env.ANDROID_KEY_ALIAS}.`,
);
