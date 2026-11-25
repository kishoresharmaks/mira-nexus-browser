#!/usr/bin/env node
/**
 * Writes the release identity into app.json before `expo prebuild`.
 *
 * The tag or workflow input is the source of truth for a CI build; nothing is
 * committed back to the repository. Android's versionCode must be a monotonically
 * increasing integer, so CI uses the workflow run number by default.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function fail(message) {
  console.error(`apply-version: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;
    const [rawKey, inlineValue] = current.slice(2).split('=', 2);
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) index += 1;
    args[rawKey] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const version = (args.version ?? '').trim().replace(/^v/, '');
const code = (args.code ?? '').trim();

if (!/^[0-9]+(\.[0-9]+){1,3}(-[0-9A-Za-z.]+)?$/.test(version)) {
  fail(
    `version "${version}" is not a dotted release version such as 1.2.3 or 1.2.3-beta.1`,
  );
}
if (!/^[1-9][0-9]*$/.test(code)) {
  fail(`version code "${code}" must be a positive integer`);
}
const versionCode = Number(code);
if (versionCode > 2_100_000_000) {
  fail('version code must be at or below 2100000000');
}

const appJsonPath = join(process.cwd(), 'app.json');
const packageJsonPath = join(process.cwd(), 'package.json');

let config;
try {
  config = JSON.parse(readFileSync(appJsonPath, 'utf8'));
} catch (error) {
  fail(`could not read app.json: ${error.message}`);
}

if (!config.expo || typeof config.expo !== 'object') {
  fail('app.json does not contain an expo object');
}
config.expo.version = version;
config.expo.android = { ...(config.expo.android ?? {}), versionCode };

writeFileSync(appJsonPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

// Synchronize package.json to prevent version divergence
try {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  pkg.version = version;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
} catch (error) {
  fail(`could not sync package.json: ${error.message}`);
}

console.log(`apply-version: app.json & package.json are now synchronized to ${version} (${versionCode})`);
