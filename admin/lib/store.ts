import {
  MongoClient,
  type Collection,
  type Filter,
  type MongoClientOptions,
} from 'mongodb';
import { createHash } from 'node:crypto';
import { promises as dnsPromises, setServers as setDnsServers } from 'node:dns';
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
const MONGO_DEFAULT_DB = 'nexusbrowser';
const MONGO_DEFAULT_COLLECTION = 'catalog';
const LOCAL_PATH = join(process.cwd(), '.data', 'catalog-state.json');

export type VersionSnapshot = {
  revision: number;
  publishedAt: string;
  catalog: Catalog;
  summary: {
    totalProviders: number;
    activeCategories: number;
  };
  publishedBy?: string;
  description?: string;
  checksum?: string;
};

export type AuditLogEntry = {
  id: string;
  action: 'publish' | 'rollback' | 'save_draft';
  revision: number;
  actor: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
};

type CatalogDocument = {
  _id: string;
  storeVersion: 1;
  draft: Catalog;
  published: StoreState['published'];
  history?: VersionSnapshot[];
  auditLogs?: AuditLogEntry[];
  savedAt: string | null;
  updatedAt: string;
};

type MongoCache = {
  uri: string;
  client: MongoClient;
  ready: Promise<MongoClient>;
};

const globalForMongo = globalThis as typeof globalThis & {
  __nexusCatalogMongo?: MongoCache;
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
 * Some networks (corporate proxies, WSL, some Windows resolvers) refuse the
 * SRV lookup the driver needs for mongodb+srv://. Setting MONGODB_DNS_SERVERS
 * to a comma-separated list of resolvers such as 1.1.1.1,8.8.8.8 lets the
 * admin start without changing the host's DNS configuration. Ignored when
 * unset, which keeps the default resolver in production.
 *
 * Applied immediately before a connection rather than at module load: the
 * standalone server bootstraps its default resolver after route modules are
 * evaluated, which otherwise discards the setting on some hosts.
 */
const dnsServers = env('MONGODB_DNS_SERVERS')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

function applyDnsServers(): void {
  if (dnsServers.length === 0) return;
  try {
    setDnsServers(dnsServers);
  } catch {
    console.warn(
      'MONGODB_DNS_SERVERS ignored: expected comma-separated IPv4 or IPv6 addresses.',
    );
  }
}

/**
 * The first SRV query after setServers can still fail on Windows while c-ares
 * reopens its sockets. Resolve once before the driver connects, retrying once,
 * so a cold first request does not report a false storage outage.
 */
async function warmUpDns(uri: string): Promise<void> {
  if (dnsServers.length === 0 || !/^mongodb\+srv:\/\//i.test(uri)) return;
  const host = new URL(uri).hostname;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    applyDnsServers();
    try {
      await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
      return;
    } catch (error) {
      if (attempt === 1) {
        console.warn(
          'MONGODB_DNS_SERVERS could not resolve the SRV record:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}

/**
 * The file store is a local preview path only. Production must use MongoDB;
 * requiring an explicit flag keeps a missing MONGODB_URI visible instead of
 * silently writing to a serverless filesystem that disappears on redeploy.
 */
function devFileEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    env('NEXUS_DEV_FILE_STORE') === '1'
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
    appName: 'nexus-catalog-admin',
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
  let cached = globalForMongo.__nexusCatalogMongo;

  if (!cached || cached.uri !== uri) {
    if (cached) {
      await cached.client.close().catch(() => undefined);
    }
    await warmUpDns(uri);
    const client = new MongoClient(uri, mongoOptions());
    cached = { uri, client, ready: client.connect() };
    globalForMongo.__nexusCatalogMongo = cached;
  }

  try {
    const client = await cached.ready;
    return client
      .db(databaseName())
      .collection<CatalogDocument>(collectionName());
  } catch (error) {
    if (globalForMongo.__nexusCatalogMongo === cached) {
      delete globalForMongo.__nexusCatalogMongo;
    }
    await cached.client.close().catch(() => undefined);
    console.warn(
      'MongoDB connection failed:',
      error instanceof Error ? error.message : String(error),
    );
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
      'The development file store is disabled. Set MONGODB_URI, or set NEXUS_DEV_FILE_STORE=1 for a local preview.',
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

/**
 * The container healthcheck needs to prove the process can reach its store.
 * This reads only `_id`, so it neither seeds an empty database nor depends on
 * a catalog document being valid. It throws on an unreachable store.
 */
export async function pingStore(): Promise<StorageMode> {
  const mode = storageMode();
  if (mode === 'file') {
    await readFileState();
    return mode;
  }
  if (mode === 'none') {
    throw new Error('No catalog store is configured.');
  }

  const collection = await mongoCollection();
  await collection.findOne(
    { _id: MONGO_DOCUMENT_ID },
    { projection: { _id: 1 } },
  );
  return mode;
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

export type PublishOptions = {
  publishedBy?: string;
  description?: string;
};

function normalizeSnapshot(raw: any): VersionSnapshot {
  const catalog = raw.catalog ?? raw.snapshot;
  const totalProviders = catalog?.categories
    ? Object.values(catalog.categories).reduce(
        (acc: number, cat: any) => acc + (cat?.providers?.length ?? 0),
        0,
      )
    : (catalog?.engines?.length ?? 0);
  const activeCategories = catalog?.categories
    ? Object.values(catalog.categories).filter((cat: any) => cat?.enabled).length
    : (catalog?.engines?.length ? 1 : 0);

  const checksum =
    raw.checksum ??
    (catalog
      ? createHash('sha256').update(JSON.stringify(catalog)).digest('hex')
      : undefined);

  return {
    revision: Number(raw.revision),
    publishedAt: String(raw.publishedAt || ''),
    catalog,
    summary: raw.summary ?? {
      totalProviders,
      activeCategories,
    },
    publishedBy: raw.publishedBy ?? 'admin',
    description: raw.description ?? `Published revision ${raw.revision}`,
    checksum,
  };
}

/**
 * Publishing is a compare-and-set on the revision the editor reviewed. Two
 * tabs cannot both publish revision 5: the second write matches no document
 * and the route returns a conflict instead of silently replacing the first.
 */
export async function publishState(
  state: StoreState,
  expectedRevision: number,
  options?: PublishOptions,
): Promise<WriteResult> {
  const savedAt = new Date().toISOString();
  const mode = storageMode();

  const totalProviders = Object.values(state.published?.categories ?? {}).reduce(
    (acc, cat) => acc + (cat.providers?.length ?? 0),
    0,
  );
  const activeCategories = Object.values(state.published?.categories ?? {}).filter(
    (cat) => cat.enabled,
  ).length;

  const catalogPayload = JSON.stringify(state.published);
  const checksum = state.published
    ? createHash('sha256').update(catalogPayload).digest('hex')
    : undefined;

  const snapshot: VersionSnapshot | null = state.published
    ? {
        revision: state.published.revision,
        publishedAt: state.published.publishedAt,
        catalog: JSON.parse(catalogPayload),
        summary: {
          totalProviders,
          activeCategories,
        },
        publishedBy: options?.publishedBy ?? 'admin',
        description:
          options?.description ??
          (expectedRevision === 0
            ? 'Initial publish'
            : `Update from revision ${expectedRevision}`),
        checksum,
      }
    : null;

  const auditEntry: AuditLogEntry | null = state.published
    ? {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action: options?.description?.toLowerCase().includes('rollback')
          ? 'rollback'
          : 'publish',
        revision: state.published.revision,
        actor: options?.publishedBy ?? 'admin',
        timestamp: savedAt,
        description:
          options?.description ?? `Published revision ${state.published.revision}`,
        metadata: {
          previousRevision: expectedRevision,
          totalProviders,
          activeCategories,
          checksum,
        },
      }
    : null;

  if (mode === 'file') {
    const current = await readFileState();
    if ((current.published?.revision ?? 0) !== expectedRevision) {
      return { ok: false, reason: 'conflict' };
    }
    const currentHistory = await getVersionHistory();
    const history = [...currentHistory, ...(snapshot ? [snapshot] : [])].slice(-50);
    const currentAudit = await getAuditLogs();
    const auditLogs = [...currentAudit, ...(auditEntry ? [auditEntry] : [])].slice(-100);
    const payload = `${JSON.stringify({ ...state, history, auditLogs }, null, 2)}\n`;
    await writeFile(LOCAL_PATH, payload, 'utf8');
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

  const update: any = {
    $set: {
      draft: state.draft,
      published: state.published,
      savedAt,
      updatedAt: savedAt,
      storeVersion: 1,
    },
  };
  const pushes: any = {};
  if (snapshot) {
    pushes.history = {
      $each: [snapshot],
      $slice: -50,
    };
  }
  if (auditEntry) {
    pushes.auditLogs = {
      $each: [auditEntry],
      $slice: -100,
    };
  }
  if (Object.keys(pushes).length > 0) {
    update.$push = pushes;
  }

  const result = await collection.updateOne(filter, update);

  if (result.matchedCount !== 1) {
    return { ok: false, reason: 'conflict' };
  }
  return { ok: true, savedAt };
}

export async function getVersionHistory(): Promise<VersionSnapshot[]> {
  const mode = storageMode();
  if (mode === 'file') {
    try {
      const raw = await readFile(LOCAL_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      const rawHistory = Array.isArray(parsed?.history) ? parsed.history : [];
      return rawHistory.map(normalizeSnapshot);
    } catch {
      return [];
    }
  }
  if (mode === 'mongodb') {
    try {
      const collection = await mongoCollection();
      const doc = await collection.findOne(
        { _id: MONGO_DOCUMENT_ID },
        { projection: { history: 1 } },
      );
      const rawHistory = Array.isArray(doc?.history) ? doc.history : [];
      return rawHistory.map(normalizeSnapshot);
    } catch {
      return [];
    }
  }
  return [];
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const mode = storageMode();
  if (mode === 'file') {
    try {
      const raw = await readFile(LOCAL_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.auditLogs) ? parsed.auditLogs : [];
    } catch {
      return [];
    }
  }
  if (mode === 'mongodb') {
    try {
      const collection = await mongoCollection();
      const doc = await collection.findOne(
        { _id: MONGO_DOCUMENT_ID },
        { projection: { auditLogs: 1 } },
      );
      return Array.isArray(doc?.auditLogs) ? doc.auditLogs : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function rollbackToVersion(
  targetRevision: number,
  options?: { rolledBackBy?: string; description?: string },
): Promise<{
  ok: boolean;
  newRevision: number;
  savedAt: string;
}> {
  const history = await getVersionHistory();
  const target = history.find((h) => h.revision === targetRevision);
  if (!target) {
    throw new Error(`Revision ${targetRevision} was not found in version history.`);
  }

  const rawCatalog = target.catalog;
  if (!rawCatalog || (!Array.isArray(rawCatalog.engines) && !rawCatalog.categories)) {
    throw new Error(`Snapshot revision ${targetRevision} contains invalid or corrupted catalog data.`);
  }

  // Validate integrity checksum if available
  if (target.checksum) {
    const computed = createHash('sha256').update(JSON.stringify(rawCatalog)).digest('hex');
    if (computed !== target.checksum) {
      throw new Error(`Snapshot revision ${targetRevision} integrity check failed: checksum mismatch.`);
    }
  }

  const currentState = await readState();
  const currentRevision = currentState.published?.revision ?? 0;
  const nextRevision = currentRevision + 1;
  const now = new Date().toISOString();

  const restoredDraft: Catalog = JSON.parse(JSON.stringify(rawCatalog));
  const restoredPublished: StoreState['published'] = {
    ...restoredDraft,
    revision: nextRevision,
    publishedAt: now,
  };

  const actor = options?.rolledBackBy ?? 'admin';
  const desc =
    options?.description ??
    `Rollback to revision ${targetRevision} (restored as revision ${nextRevision})`;

  const writeRes = await publishState(
    {
      draft: restoredDraft,
      published: restoredPublished,
    },
    currentRevision,
    {
      publishedBy: actor,
      description: desc,
    },
  );

  if (!writeRes.ok) {
    throw new Error('Rollback conflicted with another concurrent publish. Please reload the catalog desk.');
  }

  return {
    ok: true,
    newRevision: nextRevision,
    savedAt: writeRes.savedAt,
  };
}
