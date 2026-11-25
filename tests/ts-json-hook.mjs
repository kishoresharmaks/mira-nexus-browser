import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    for (const ext of ['.ts', '.tsx', '/index.ts', '.json']) {
      const candidate = new URL(`${target.href}${ext}`);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    }
  }

  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) && context.parentURL) {
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      const candidate = new URL(`${specifier}${ext}`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    return {
      format: 'json',
      shortCircuit: true,
      source,
    };
  }
  return nextLoad(url, context);
}
