# Mira catalog desk

A small Next.js admin for the three lists Mira reads remotely:

- **Search engines** — the presets shown in Search settings, plus the default.
- **Today's page** — the editorial shelf used by the daily rotation.
- **Advertising** — whether the one home-screen AdMob banner is on, its layout,
  test mode, and the per-platform unit IDs.

The app fetches only the published catalog from a public, read-only endpoint.
Drafts are private until you press Publish.

## How the catalog is stored

The desk uses **MongoDB Atlas**. Everything lives in one document:

- Database: `mira` (override with `MONGODB_DB`)
- Collection: `catalog` (override with `MONGODB_COLLECTION`)
- Document: `_id: "catalog"`

```json
{
  "_id": "catalog",
  "storeVersion": 1,
  "draft": {
    "version": 1,
    "defaultEngineId": "duckduckgo",
    "ads": {
      "enabled": false,
      "testMode": true,
      "layout": "inline",
      "androidUnitId": "",
      "iosUnitId": ""
    },
    "engines": [],
    "pages": []
  },
  "published": {
    "version": 1,
    "defaultEngineId": "duckduckgo",
    "ads": {
      "enabled": false,
      "testMode": true,
      "layout": "inline",
      "androidUnitId": "",
      "iosUnitId": ""
    },
    "engines": [],
    "pages": [],
    "revision": 1,
    "publishedAt": "2026-10-27T00:00:00.000Z"
  },
  "savedAt": "2026-10-30T09:12:00.000Z",
  "updatedAt": "2026-10-30T09:12:00.000Z"
}
```

Reads and writes go through `admin/lib/store.ts`:

1. `readState()` reuses a cached `MongoClient` (kept on `globalThis` so Next.js
   hot reload and reused serverless instances do not open a pool per request)
   and runs `findOne({ _id: "catalog" })`.
2. If the document does not exist, the desk inserts the seed from
   `admin/lib/default-catalog.json`. If two requests race, the duplicate-key
   loser reads the winner instead of overwriting it.
3. `PUT /api/catalog/draft` calls `saveDraft()`, which updates **only** the
   `draft` field plus `savedAt` and `updatedAt`. A draft save cannot replace a
   newer published revision with a stale copy.
4. `POST /api/catalog/publish` validates the draft, then calls `publishState()`.
   That write is a compare-and-set on the `published.revision` the editor
   reviewed. It updates `draft` and `published` together and returns `409` if
   another publish won first.
5. `GET /api/catalog` reads `published`, removes disabled entries, and serves
   the public shape with an ETag based on the revision.

The client and server both treat stored data as untrusted: `coerceStoreState()`
and `coerceCatalog()` rebuild it before use.

## Local development

```bash
cd admin
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```
ADMIN_PASSWORD=at-least-8-characters
ADMIN_SESSION_SECRET=at-least-32-random-characters
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

Generate the signing secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Start the desk:

```bash
npm run dev
```

Open <http://localhost:3100>.

### Before Atlas is available

The production path is MongoDB only. For a local preview you can opt into a file
store explicitly:

```
MIRA_DEV_FILE_STORE=1
```

That uses the git-ignored `admin/.data/catalog-state.json` and makes the header
say **Local file · dev only**. The flag is ignored when `NODE_ENV=production`.
Without `MONGODB_URI` and without the flag, the desk shows the setup screen
instead of silently writing to a filesystem that disappears on redeploy.

## Atlas setup

1. Create a cluster (the free M0 tier is enough for one editor).
2. **Database Access** → add a user whose role is `readWrite` on `mira`.
3. **Network Access** → add the public IP of the machine running the admin.
   Vercel Functions use dynamic egress addresses; either allow `0.0.0.0/0` with
   a strong database password, or use fixed egress/private networking.
4. **Connect** → **Drivers** → **Node.js** → copy the `mongodb+srv://` string.
   Replace the password placeholder and URL-encode special characters
   (`@`, `:`, `/`, `?`, `#`, `%`).
5. Put the string in `MONGODB_URI`. Leave the database name out of the path if
   you prefer `MONGODB_DB=mira`; otherwise put `/mira` before the `?`.

### DNS check

`mongodb+srv` needs the cluster's SRV and TXT records to resolve before the
driver can connect:

```powershell
nslookup -type=SRV _mongodb._tcp.<cluster-host>
nslookup -type=TXT <cluster-host>
```

Both must return records. If SRV lookups are blocked on the local network, the
desk cannot connect even with a correct password. Use a network that resolves
SRV/TXT, or switch to a standard `mongodb://` seed-list URI if Atlas provides
one for your cluster.

When the desk cannot read the store it shows the driver error, the target
`mira.catalog`, and a checklist for DNS, Network Access, and the database user.
The URI itself is never rendered.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | The single password for the desk. Minimum 8 characters. |
| `ADMIN_SESSION_SECRET` | Yes | HMAC key for the session cookie. Minimum 32 characters. Rotating it signs every session out. |
| `MONGODB_URI` | Yes | Atlas connection string. `mongodb+srv` or `mongodb`. Server-only. |
| `MONGODB_DB` | No | Database name. Defaults to `mira`. |
| `MONGODB_COLLECTION` | No | Collection name. Defaults to `catalog`. |
| `MIRA_DEV_FILE_STORE` | No | Set to `1` in local development to use the file store when `MONGODB_URI` is missing. Ignored in production. |

If a required value is missing or too short, the desk shows a setup notice with
the missing variable names instead of the login form.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Password | The workbench. |
| `GET /api/catalog` | Public | Published feed, CORS-enabled, ETag, five-minute edge cache. |
| `PUT /api/catalog/draft` | Session | Save the draft without publishing. |
| `POST /api/catalog/publish` | Session | Validate and publish a new revision. Returns `409` on a revision conflict. |
| `GET /api/health` | Public | Docker/uptime check. Reports `auth` and `storage` status; no secrets or error text. |
| `POST /api/auth/login` | Public | Rate-limited password login. |
| `POST /api/auth/logout` | Session | Clear the session cookie. |

## Deploy

The production path is Docker Compose + Caddy on a VPS, with automatic HTTPS.
The complete guide, including Atlas, DNS, backups, upgrades, and rollback, is in
[`../VPS_DEPLOYMENT.md`](../VPS_DEPLOYMENT.md).

Quick version on the VPS:

```bash
cd /opt/mira/admin
cp .env.docker.example .env
chmod 600 .env
# fill in ADMIN_DOMAIN, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, MONGODB_URI
docker compose build
docker compose up -d
curl -fsS https://catalog.example.com/api/health
```

The image uses `output: "standalone"` from `next.config.ts`, runs as a non-root
user, and has no writable host mount. Caddy owns ports 80/443 and proxies to the
admin on the private Compose network.

### Deploy to Vercel instead

1. Push this repository to a Git host Vercel can read.
2. Import the repository and set **Root Directory** to `admin`.
3. Framework preset: **Next.js**. Build command: `npm run build`.
4. Add `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `MONGODB_URI` under
   Production (and Preview if you want a staging desk). Add `MONGODB_DB` or
   `MONGODB_COLLECTION` only if you changed the defaults.
5. Confirm Atlas **Network Access** allows Vercel's egress, and that the
   database user can read and write `mira`.
6. Deploy. Verify `https://<project>/api/health` returns `200` with
   `"storage": "ok"`. Then open the production URL, sign in, edit the draft, and
   publish.
7. Check `https://<project>/api/catalog` in a private window. It must return the
   published catalog with `"revision"` set.
8. In the Expo build environment, set:

   ```
   EXPO_PUBLIC_CATALOG_URL=https://<project>/api/catalog
   ```

   Rebuild the app. An empty value keeps the bundled catalog.

The app checks the feed at most hourly, on foreground, and when Search settings
opens if the cached copy is stale. The feed is served with a five-minute edge
cache, so a newly published revision can take a few minutes to appear.

## Editing rules

- A live engine needs a name, an HTTPS search URL, and exactly one `%s` where the
  query belongs.
- A live Today page needs a title, a plain HTTPS URL, a category, a whole-number
  reading time from 1 to 120 minutes, and a note.
- Hidden entries stay in the draft and are removed from the public feed.
- The default engine must exist and be live.
- Limits match the app: **40 engines** and **250 pages**. The app drops anything
  above those limits.

## Advertising

The third tab edits the single home-screen placement. Nothing is sent to Google
from the desk; the app requests ads directly after UMP consent.

| Field | Behaviour |
| --- | --- |
| `enabled` | Turns the placement on or off in the next published feed. Default off. |
| `testMode` | Forces Google test units. Development builds force test units even when this is off. |
| `layout` | `inline` sits between Today's page and Trails; `anchored` pins above the bottom safe area. |
| `androidUnitId` / `iosUnitId` | AdMob banner unit IDs in the form `ca-app-pub-<16 digits>/<10 digits>`. Leave a platform blank if it is not shipping. |

Publishing live mode (`enabled` on, `testMode` off) requires at least one valid
unit ID. Malformed IDs block publish with a field-level issue; the app also
rejects them and shows no slot. The public feed carries the resolved
configuration, so a change reaches the app on its next catalog check.

Use Google test app IDs in `app.json` until the real AdMob apps exist. Replace
them before a production build; Android crashes at startup if the AdMob
application ID is invalid.

## Source of truth

`catalog/defaults.json` in the repository root is canonical, including the `ads`
block. After editing it, run from the repository root:

```bash
npm run catalog:sync
```

This refreshes `src/lib/default-catalog.json` and
`admin/lib/default-catalog.json`. The admin seed only applies when no MongoDB
document exists, so syncing does not overwrite a live draft or published
revision.

## Security notes

- The MongoDB URI is a server secret. Never expose it through a `NEXT_PUBLIC_`
  variable, the browser, or a log line.
- Give the Atlas user `readWrite` on one database, not an administrative role.
- The session is an HMAC-signed, HTTP-only, `SameSite=Lax` cookie that expires
  after seven days.
- Login attempts are limited to eight failures per ten minutes per client key.
- State-changing routes check `Origin` against `Host`.
- Publishing is a compare-and-set on the revision, so two tabs cannot silently
  replace each other's revision.
- The public feed is read-only, CORS-enabled, and contains only enabled entries.
- AdMob app IDs live in `app.json`; ad unit IDs live in the published catalog.
  Unit IDs are public identifiers, not secrets. Never put an AdMob account
  password or API credential in the catalog.
- The admin frame is denied (`X-Frame-Options: DENY`), and the desk sends
  `no-referrer` plus a restrictive permissions policy.
- The public feed carries no reader data. Keep it that way: no names, emails,
  account IDs, or notes about individual readers in the catalog.
- `/api/health` names only the failed component. It never returns the MongoDB
  URI, driver error, or environment values.

## Commands

```bash
npm run dev        # local desk on :3100
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run start      # serve the production build on :3100
```

Container deployment (from `admin/`):

```bash
cp .env.docker.example .env  # once, then edit
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f admin
curl -fsS https://catalog.example.com/api/health
```
