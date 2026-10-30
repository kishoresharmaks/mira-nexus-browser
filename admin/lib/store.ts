import { get, put } from '@vercel/blob';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  coerceStoreState,
  createSeedState,
  type StoreState,
} from '@/lib/catalog';

const BLOB_PATH = 'mira/catalog-state.json';
const LOCAL_PATH = join(process.cwd(), '.data', 'catalog-state.json');

type StorageMode = 'blob' | 'file';

function useBlob(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

export function storageMode(): StorageMode {
  return useBlob() ? 'blob' : 'file';
}

async function readBlobState(): Promise<StoreState> {
  const result = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!result) return createSeedState();
  if (result.statusCode !== 200) {
    throw new Error(`The catalog store returned ${result.statusCode}.`);
  }

  const raw = await new Response(result.stream).text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The stored catalog is not valid JSON.');
  }

  const state = coerceStoreState(parsed);
  if (!state) throw new Error('The stored catalog has no usable draft or feed.');
  return state;
}

async function readFileState(): Promise<StoreState> {
  let raw: string;
  try {
    raw = await readFile(LOCAL_PATH, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createSeedState();
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The local catalog file is not valid JSON.');
  }

  const state = coerceStoreState(parsed);
  if (!state) throw new Error('The local catalog file has no usable draft.');
  return state;
}

export async function readState(): Promise<StoreState> {
  return useBlob() ? readBlobState() : readFileState();
}

async function writeBlobState(state: StoreState): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(state, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

async function writeFileState(state: StoreState): Promise<void> {
  const payload = `${JSON.stringify(state, null, 2)}\n`;
  await mkdir(dirname(LOCAL_PATH), { recursive: true });
  const temporary = `${LOCAL_PATH}.${process.pid}.tmp`;
  await writeFile(temporary, payload, 'utf8');
  try {
    await rename(temporary, LOCAL_PATH);
  } catch {
    // Windows can refuse to replace an existing file with rename. The catalog
    // is small and single-editor; a direct write is an acceptable fallback.
    await writeFile(LOCAL_PATH, payload, 'utf8');
    await rm(temporary, { force: true });
  }
}

export async function writeState(state: StoreState): Promise<void> {
  if (useBlob()) await writeBlobState(state);
  else await writeFileState(state);
}
