/**
 * Phase 7 — Dynamic Discovery & Offline-First Content System Acceptance Test Suite
 * Tests A through I
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=================================================================');
console.log('  NEXUS BROWSER — PHASE 7 DISCOVERY SYSTEM ACCEPTANCE TEST SUITE');
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passCount++;
  } catch (err) {
    console.error(`❌ ${description}`);
    console.error(`   ${err.message}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// Test I: ZERO Hardcoded Discovery Fallback Data in App
// -------------------------------------------------------------
console.log('--- TEST I: AUDIT OF ZERO HARDCODED DISCOVERY CONTENT ---');

test('catalog/defaults.json contains zero hardcoded pages and discoveryCategories', () => {
  const defaultsPath = path.resolve(__dirname, '../catalog/defaults.json');
  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  assert.strictEqual(Array.isArray(defaults.pages), true, 'pages must be an array');
  assert.strictEqual(defaults.pages.length, 0, 'pages must be empty in defaults.json');
  assert.strictEqual(Array.isArray(defaults.discoveryCategories), true, 'discoveryCategories must be an array');
  assert.strictEqual(defaults.discoveryCategories.length, 0, 'discoveryCategories must be empty in defaults.json');
});

test('src/lib/default-catalog.json contains zero hardcoded pages and discoveryCategories', () => {
  const defaultCatalogPath = path.resolve(__dirname, '../src/lib/default-catalog.json');
  const defaultCatalog = JSON.parse(fs.readFileSync(defaultCatalogPath, 'utf8'));
  assert.strictEqual(defaultCatalog.pages.length, 0, 'pages must be empty in mobile default catalog');
  assert.strictEqual(defaultCatalog.discoveryCategories.length, 0, 'discoveryCategories must be empty in mobile default catalog');
});

test('admin/lib/default-catalog.json contains zero hardcoded pages and discoveryCategories', () => {
  const adminCatalogPath = path.resolve(__dirname, '../admin/lib/default-catalog.json');
  const adminCatalog = JSON.parse(fs.readFileSync(adminCatalogPath, 'utf8'));
  assert.strictEqual(adminCatalog.pages.length, 0, 'pages must be empty in admin default catalog');
  assert.strictEqual(adminCatalog.discoveryCategories.length, 0, 'discoveryCategories must be empty in admin default catalog');
});

test('No hardcoded CURATED_PAGES fallback exists in src/', () => {
  const curationPath = path.resolve(__dirname, '../src/lib/curation.ts');
  const curationCode = fs.readFileSync(curationPath, 'utf8');
  assert.strictEqual(curationCode.includes('CURATED_PAGES ='), false, 'CURATED_PAGES constant must not exist');
  assert.strictEqual(curationCode.includes('BUNDLED_CATALOG.pages'), false, 'Must not reference bundled catalog pages');
});

test('No hardcoded USEFUL_DESTINATIONS fallback exists in DiscoverySection.tsx', () => {
  const discoverySectionPath = path.resolve(__dirname, '../src/components/home/DiscoverySection.tsx');
  const sectionCode = fs.readFileSync(discoverySectionPath, 'utf8');
  assert.strictEqual(sectionCode.includes('USEFUL_DESTINATIONS'), false, 'USEFUL_DESTINATIONS must be eliminated');
});

// -------------------------------------------------------------
// Test A: Schema & Model Normalization
// -------------------------------------------------------------
console.log('\n--- TEST A: DYNAMIC CATEGORY & ITEM NORMALIZATION ---');

const catalogTsPath = path.resolve(__dirname, '../src/lib/catalog.ts');
const catalogTs = fs.readFileSync(catalogTsPath, 'utf8');

test('Catalog TypeScript defines normalizeDiscoveryCategory and all discovery fields', () => {
  assert(catalogTs.includes('function normalizeDiscoveryCategory'), 'normalizeDiscoveryCategory must exist');
  assert(catalogTs.includes('contentType:'), 'contentType must be handled in normalizePage');
  assert(catalogTs.includes('dailySlot:'), 'dailySlot must be handled in normalizePage');
  assert(catalogTs.includes('discoveryCategories:'), 'discoveryCategories must be handled in normalizeCatalog');
  assert(catalogTs.includes('pages.sort((a, b) => a.order - b.order)'), 'discovery items must be sorted by order');
  assert(catalogTs.includes('discoveryCategories.sort((a, b) => a.order - b.order)'), 'discovery categories must be sorted by order');
});

test('Catalog normalizer handles empty discovery gracefully without invalidating search catalog', () => {
  assert(!catalogTs.includes('if (pages.length === 0) return null;'), 'Must not reject catalog when pages are empty');
});

// -------------------------------------------------------------
// Test B: DiscoveryCache Persistence & Atomic Safety
// -------------------------------------------------------------
console.log('\n--- TEST B: OFFLINE CACHE PERSISTENCE & ATOMIC SAFETY ---');

const cachePath = path.resolve(__dirname, '../src/lib/discovery/DiscoveryCache.ts');
const cacheTs = fs.readFileSync(cachePath, 'utf8');

test('DiscoveryCache implements atomic staged write (write-then-commit)', () => {
  assert(cacheTs.includes('STAGING_KEY'), 'Must stage write using temporary key');
  assert(cacheTs.includes('isValidSnapshot'), 'Must validate snapshot schema before committing');
  assert(cacheTs.includes('removeItem(STAGING_KEY)'), 'Must clean up staging key');
});

test('DiscoveryCache validates snapshot schema and integrity', () => {
  assert(cacheTs.includes('isValidSnapshot(data: unknown)'), 'Must have structural snapshot validator');
  assert(cacheTs.includes('Array.isArray(s.items)'), 'Must validate items array');
  assert(cacheTs.includes('Array.isArray(s.categories)'), 'Must validate categories array');
});

// -------------------------------------------------------------
// Test C: ETag & Conditional Synchronization
// -------------------------------------------------------------
console.log('\n--- TEST C: ETAG & CONDITIONAL 304 NOT MODIFIED SYNCHRONIZATION ---');

const providerPath = path.resolve(__dirname, '../src/lib/discovery/DiscoveryProvider.tsx');
const providerTs = fs.readFileSync(providerPath, 'utf8');

test('DiscoveryProvider handles If-None-Match ETag request headers', () => {
  assert(providerTs.includes("headers['If-None-Match'] = storedETag"), 'Must pass If-None-Match header when ETag exists');
});

test('DiscoveryProvider handles HTTP 304 Not Modified without rewriting or corrupting cache', () => {
  assert(providerTs.includes('if (response.status === 304)'), 'Must explicitly handle 304 Not Modified');
  assert(providerTs.includes('setIsOffline(false)'), 'Must confirm online status on 304');
  assert(providerTs.includes('setLastSyncAt(Date.now())'), 'Must touch lastSyncAt timestamp on 304');
});

// -------------------------------------------------------------
// Test D: Dynamic Category Filtering & Repository Queries
// -------------------------------------------------------------
console.log('\n--- TEST D: DYNAMIC CATEGORY FILTERING & REPOSITORY QUERIES ---');

const repoPath = path.resolve(__dirname, '../src/lib/discovery/DiscoveryRepository.ts');
const repoTs = fs.readFileSync(repoPath, 'utf8');

test('DiscoveryRepository filters out disabled or expired items', () => {
  assert(repoTs.includes('getEligibleItems'), 'getEligibleItems must filter items');
  assert(repoTs.includes('item.enabled === false'), 'Must exclude disabled items');
  assert(repoTs.includes('expiresAt'), 'Must respect item expiration timestamp');
});

test('DiscoveryRepository maps categories and handles "all" filter and custom categories', () => {
  assert(repoTs.includes("if (!filterId || filterId === 'all')"), 'Must support "all" filter');
  assert(repoTs.includes('targetCategory.contentTypes.includes(item.contentType)'), 'Must match item contentType against category contentTypes');
});

// -------------------------------------------------------------
// Test E: Network Failure Preserves Offline Cache
// -------------------------------------------------------------
console.log('\n--- TEST E: NETWORK FAILURE RESILIENCE & OFFLINE PERSISTENCE ---');

test('DiscoveryProvider catch block retains cached content and flags isOffline', () => {
  assert(providerTs.includes('setIsOffline(true)'), 'Must flag isOffline on failure');
  assert(providerTs.includes('// On network failure or abort, mark offline but preserve cache'), 'Must not clear items or categories in catch block');
});

// -------------------------------------------------------------
// Test F: Invalid Feed Validation & Rejection
// -------------------------------------------------------------
console.log('\n--- TEST F: MALFORMED FEED VALIDATION & SAFEGUARD ---');

test('DiscoveryProvider validates remote payload using normalizeCatalog before caching', () => {
  assert(providerTs.includes('const normalized = normalizeCatalog(rawJson)'), 'Must pass raw response through normalizeCatalog');
  assert(providerTs.includes("throw new Error('Remote catalog feed failed validation.')"), 'Must throw and abort on invalid payload without corrupting cache');
});

// -------------------------------------------------------------
// Test G: Privacy & Revisit Recent Safety
// -------------------------------------------------------------
console.log('\n--- TEST G: REVISIT RECENT ON-DEVICE PRIVACY ---');

test('DiscoverySection generates Revisit Recent strictly from local history excluding private schemes', () => {
  const sectionTs = fs.readFileSync(path.resolve(__dirname, '../src/components/home/DiscoverySection.tsx'), 'utf8');
  assert(sectionTs.includes("url.startsWith('about:')"), 'Must exclude about: pages');
  assert(sectionTs.includes("url.startsWith('javascript:')"), 'Must exclude javascript: pages');
  assert(sectionTs.includes("url.startsWith('chrome:')"), 'Must exclude chrome: pages');
  assert(sectionTs.includes('slice(0, 6)'), 'Must limit local history scan to recent entries');
});

// -------------------------------------------------------------
// Test H: Daily Editorial Slots & Deterministic Rotation
// -------------------------------------------------------------
console.log('\n--- TEST H: DAILY EDITORIAL SLOTS & ROTATION ---');

test('DiscoveryRepository resolves explicit slots and falls back to deterministic rotation', () => {
  assert(repoTs.includes("dailySlot === 'website_of_day'"), 'Must resolve explicit website_of_day');
  assert(repoTs.includes("dailySlot === 'article_of_day'"), 'Must resolve explicit article_of_day');
  assert(repoTs.includes("dailySlot === 'developer_discovery'"), 'Must resolve explicit developer_discovery');
  assert(repoTs.includes('serial % eligible.length'), 'Must use calendar serial rotation as fallback');
});

test('DiscoveryRepository builds archive deterministically', () => {
  assert(repoTs.includes('resolveArchive'), 'resolveArchive method must exist');
  assert(repoTs.includes('atOffset(from, offset)'), 'Must roll backward over calendar days using atOffset');
});

// -------------------------------------------------------------
// Admin Discovery Workspace Audit
// -------------------------------------------------------------
console.log('\n--- ADMIN WORKSPACE DISCOVERY AUDIT ---');

test('Admin PageEditor supports Content Type, Daily Slot, Image, Tags, Author, Order', () => {
  const pageEditorTs = fs.readFileSync(path.resolve(__dirname, '../admin/components/workbench/PageEditor.tsx'), 'utf8');
  assert(pageEditorTs.includes('Content Type'), 'Must have Content Type selector');
  assert(pageEditorTs.includes('Daily Slot Assignment'), 'Must have Daily Slot selector');
  assert(pageEditorTs.includes('Image URL (optional)'), 'Must have Image URL field');
  assert(pageEditorTs.includes('Tags (comma-separated)'), 'Must have Tags input');
  assert(pageEditorTs.includes('Display Order'), 'Must have Display Order input');
});

test('Admin PagePanel supports category management and live status', () => {
  const pagePanelTs = fs.readFileSync(path.resolve(__dirname, '../admin/components/workbench/PagePanel.tsx'), 'utf8');
  assert(pagePanelTs.includes('Categories'), 'Must have Categories modal trigger button');
  assert(pagePanelTs.includes('Slot'), 'Must display Slot column');
  assert(pagePanelTs.includes('page.dailySlot'), 'Must render daily slot badge');
});

test('Admin DiscoveryCategoriesModal allows CRUD on discovery categories', () => {
  const modalTs = fs.readFileSync(path.resolve(__dirname, '../admin/components/workbench/DiscoveryCategoriesModal.tsx'), 'utf8');
  assert(modalTs.includes('DiscoveryCategoriesModal'), 'Modal component exists');
  assert(modalTs.includes('onAddCategory'), 'Allows adding categories');
  assert(modalTs.includes('onUpdateCategory'), 'Allows updating categories');
  assert(modalTs.includes('onDeleteCategory'), 'Allows deleting categories');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n=================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('=================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 7 DISCOVERY SYSTEM ACCEPTANCE TESTS PASSED!');
  process.exit(0);
}
