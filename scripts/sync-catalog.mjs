#!/usr/bin/env node
/**
 * The catalog is read by two separate runtimes with separate deploy roots:
 * the Expo app and the Next.js admin. Keep the canonical copy here and mirror
 * it into both packages so neither has to reach outside its own root at build
 * or bundle time.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = join(root, 'catalog', 'defaults.json');
const targets = [
  join(root, 'src', 'lib', 'default-catalog.json'),
  join(root, 'admin', 'lib', 'default-catalog.json'),
];

const raw = await readFile(canonicalPath, 'utf8');
const catalog = JSON.parse(raw);

if (!Array.isArray(catalog.engines) || catalog.engines.length === 0) {
  throw new Error('catalog/defaults.json must contain at least one engine');
}
if (!Array.isArray(catalog.pages)) {
  throw new Error('catalog/defaults.json must contain a pages array');
}

const ids = new Set();
for (const item of [...catalog.engines, ...catalog.pages]) {
  if (!item.id || ids.has(item.id)) {
    throw new Error(`catalog/defaults.json has a missing or duplicate id: ${item.id}`);
  }
  ids.add(item.id);
}

for (const engine of catalog.engines) {
  if (!/^https:\/\//i.test(engine.searchUrl)) {
    throw new Error(`Engine ${engine.id} must use https`);
  }
  const placeholders = engine.searchUrl.split('%s').length - 1;
  if (placeholders !== 1) {
    throw new Error(`Engine ${engine.id} must contain exactly one %s placeholder`);
  }
}

const output = `${JSON.stringify(catalog, null, 2)}\n`;
for (const target of targets) {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output, 'utf8');
  console.log(`catalog: wrote ${target}`);
}
