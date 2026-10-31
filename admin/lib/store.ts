import {
  MongoClient,
  type Collection,
  type Filter,
  type MongoClientOptions,
} from 'mongodb';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  coerceStoreState,
  createSeedState,
  type Catalog,
  type StoreState,
} from '@/lib/catalog';

export type StorageMode = 'mongodb' | 'file' | 'none';

export type WriteResult =
  | { ok: true; savedAt: string }
  | { ok: false; reason: 'conflict' };

const MONGO_DOCUMENT_ID = 'catalog';
const MONGO_DEFAULT_DB = 'mira';
const MONGO_DEFAULT_COLLECTION = 'catalog';
const LOCAL_PATH = join(process.cwd(), '.data', 'catalog-state.json');

type CatalogDocument = {
  _id: string;
  storeVersion: 1;
  draft: Catalog;
  published: StoreState['published'];
  savedAt: string | null;
  updatedAt: string;
};

type MongoCache = {
  uri: string;
  client: MongoClient;
  ready: Promise<MongoClient>;
};

const globalForMongo = globalThis as typeof globalThis & {
  __miraCatalogMongo?: MongoCache;
};

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function databaseName(): string {
  return env('MONGODB_DB') || MONGO_DEFAULT_DB;
}

function collectionName(): string {
  return env('MONGODB_COLLECTION') || MONGO_DEFAULT_COLLECTION;
}

/**
 * The file store is a local preview path only. Production must use MongoDB;
 * requiring an explicit flag keeps a missing MONGODB_URI visible instead of
 * silently writing to a serverless filesystem that disappears on redeploy.
 */
function devFileEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    env('MIRA_DEV_FILE_STORE') === '1'
  );
}

export function storageMode(): StorageMode {
  if (env('MONGODB_URI')) return 'mongodb';
  if (devFileEnabled()) return 'file';
  return 'none';
}

export function mongoConfigured(): boolean {
  return Boolean(env('MONGODB_URI'));
}

/** Safe to show in the admin UI: never returns credentials from the URI. */
export function storageTarget(): string {
  const mode = storageMode();
  if (mode === 'mongodb') return `${databaseName()}.${collectionName()}`;
  if (mode === 'file') return 'admin/.data/catalog-state.json';
  return 'not configured';
}

function mongoUri(): string {
  const uri = env('MONGODB_URI');
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://.');
  }
  return uri;
}

function mongoOptions(): MongoClientOptions {
  return {
    appName: 'mira-catalog-admin',
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 5,
  };
}

/**
 * Serverless functions are reused, so keep one client across requests. The
 * promise is cached before it settles, which prevents a burst of cold requests
 * from opening several pools. A failed connect clears the cache so the next
 * request can retry after DNS or Atlas network access is fixed.
 */
async function mongoCollection(): Promise<Collection<CatalogDocument>> {
  const uri = mongoUri();
  let cached = globalForMongo.__miraCatalogMongo;

  if (!cached || cached.uri !== uri) {
    if (cached) {
      await cached.client.close().catch(() => undefined);
    }
    const client = new MongoClient(uri, mongoOptions());
    cached = { uri, client, ready: client.connect() };
    globalForMongo.__miraCatalogMongo = cached;
  }

  try {
    const client = await cached.ready;
    return client
      .db(databaseName())
      .collection<CatalogDocument>(collectionName());
  } catch (error) {
    if (globalForMongo.__miraCatalogMongo === cached) {
      delete globalForMongo.__miraCatalogMongo;
    }
    await cached.client.close().catch(() => undefined);
    throw error;
  }
}

function stateFromDocument(document: CatalogDocument): StoreState {
  const state = coerceStoreState(document);
  if (!state) {
    throw new Error('The stored catalog has no usable draft or feed.');
  }
  return state;
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

async function readMongoState(): Promise<StoreState> {
  const collection = await mongoCollection();
  const existing = await collection.findOne({ _id: MONGO_DOCUMENT_ID });
  if (existing) return stateFromDocument(existing);

  const seed = createSeedState();
  const now = new Date().toISOString();
  try {
    await collection.insertOne({
      _id: MONGO_DOCUMENT_ID,
      storeVersion: 1,
      draft: seed.draft,
      published: seed.published,
      savedAt: null,
      updatedAt: now,
    });
    return seed;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;

    // Another request seeded the collection between our read and insert. Its
    // document is just as valid as the seed, so use the winner.
    const raced = await collection.findOne({ _id: MONGO_DOCUMENT_ID });
    if (!raced) throw error;
    return stateFromDocument(raced);
  }
}

async function readFileState(): Promise<StoreState> {
  if (!devFileEnabled()) {
    throw new Error(
      'The development file store is disabled. Set MONGODB_URI, or set MIRA_DEV_FILE_STORE=1 for a local preview.',
    );
  }

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
  const mode = storageMode();
  if (mode === 'mongodb') return readMongoState();
  if (mode === 'file') return readFileState();
  throw new Error(
    'No catalog store is configured. Set MONGODB_URI in admin/.env.local.',
  );
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

/**
 * A draft save touches only the draft field. It must never write a stale copy
 * of the published feed over a revision someone just published.
 */
export async function saveDraft(draft: Catalog): Promise<WriteResult> {
  const savedAt = new Date().toISOString();
  const mode = storageMode();

  if (mode === 'file') {
    const state = await readFileState();
    await writeFileState({ ...state, draft });
    return { ok: true, savedAt };
  }
  if (mode === 'none') {
    throw new Error(
      'No catalog store is configured. Set MONGODB_URI in admin/.env.local.',
    );
  }

  const collection = await mongoCollection();
  await collection.updateOne(
    { _id: MONGO_DOCUMENT_ID },
    {
      $set: { draft, savedAt, updatedAt: savedAt, storeVersion: 1 },
      $setOnInsert: { published: null },
    },
    { upsert: true },
  );
  return { ok: true, savedAt };
}

/**
 * Publishing is a compare-and-set on the revision the editor reviewed. Two
 * tabs cannot both publish revision 5: the second write matches no document
 * and the route returns a conflict instead of silently replacing the first.
 */
export async function publishState(
  state: StoreState,
  expectedRevision: number,
): Promise<WriteResult> {
  const savedAt = new Date().toISOString();
  const mode = storageMode();

  if (mode === 'file') {
    const current = await readFileState();
    if ((current.published?.revision ?? 0) !== expectedRevision) {
      return { ok: false, reason: 'conflict' };
    }
    await writeFileState(state);
    return { ok: true, savedAt };
  }
  if (mode === 'none') {
    throw new Error(
      'No catalog store is configured. Set MONGODB_URI in admin/.env.local.',
    );
  }

  const collection = await mongoCollection();
  const filter: Filter<CatalogDocument> = {
    _id: MONGO_DOCUMENT_ID,
    $expr: {
      $eq: [{ $ifNull: ['$published.revision', 0] }, expectedRevision],
    },
  };

  const result = await collection.updateOne(filter, {
    $set: {
      draft: state.draft,
      published: state.published,
      savedAt,
      updatedAt: savedAt,
      storeVersion: 1,
    },
  });

  if (result.matchedCount !== 1) {
    return { ok: false, reason: 'conflict' };
  }
  return { ok: true, savedAt };
}
