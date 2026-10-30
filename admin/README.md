# Mira catalog desk

A small Next.js admin for the two lists Mira reads remotely:

- **Search engines** — the presets shown in Search settings, plus the default.
- **Today's page** — the editorial shelf used by the daily rotation.

The app fetches only the published catalog from a public, read-only endpoint.
Drafts are private until you press Publish.

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
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Start the desk:

```bash
npm run dev
```

Open <http://localhost:3100>. Without Blob credentials the admin stores state in
the ignored `admin/.data/catalog-state.json`. Delete that file to return to the
seed catalog.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | The single password for the desk. Minimum 8 characters. |
| `ADMIN_SESSION_SECRET` | Yes | HMAC key for the session cookie. Minimum 32 characters. Rotating it signs every session out. |
| `BLOB_READ_WRITE_TOKEN` | Production | Private Vercel Blob access. |
| `BLOB_STORE_ID` | Production | Alternative to the token when the store is connected through Vercel's OIDC binding. |

Both admin values are required. If either is missing or too short, the desk
shows a setup notice instead of the login form.

## Storage

- **Production:** private Vercel Blob at `mira/catalog-state.json`.
- **Local fallback:** `admin/.data/catalog-state.json` when no Blob credentials
  are present.
- **Seed:** `admin/lib/default-catalog.json`, generated from
  `catalog/defaults.json`.

The stored object holds both the draft and the last published revision. Writes
are whole-file and single-editor; this desk is built for one operator, not a
team with concurrent editing.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Password | The workbench. |
| `GET /api/catalog` | Public | Published feed, CORS-enabled, ETag, five-minute edge cache. |
| `PUT /api/catalog/draft` | Session | Save the draft without publishing. |
| `POST /api/catalog/publish` | Session | Validate and publish a new revision. |
| `POST /api/auth/login` | Public | Rate-limited password login. |
| `POST /api/auth/logout` | Session | Clear the session cookie. |

## Deploy to Vercel

1. Push this repository to a Git host Vercel can read.
2. Import the repository and set **Root Directory** to `admin`.
3. Framework preset: **Next.js**. Build command: `npm run build`.
4. Create a **private** Vercel Blob store and connect it to the project.
5. Add `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` under Production (and Preview
   if you want a staging desk).
6. Deploy. Open the production URL, sign in, edit the draft, and publish.
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

## Source of truth

`catalog/defaults.json` in the repository root is canonical. After editing it,
run from the repository root:

```bash
npm run catalog:sync
```

This refreshes `src/lib/default-catalog.json` and
`admin/lib/default-catalog.json`. The admin seed only applies when no stored
state exists, so syncing does not overwrite a live draft or published revision.

## Security notes

- The session is an HMAC-signed, HTTP-only, `SameSite=Lax` cookie that expires
  after seven days.
- Login attempts are limited to eight failures per ten minutes per client key.
- State-changing routes check `Origin` against `Host`.
- The public feed is read-only, CORS-enabled, and contains only enabled entries.
- The admin frame is denied (`X-Frame-Options: DENY`), and the desk sends
  `no-referrer` plus a restrictive permissions policy.
- The public feed carries no reader data. Keep it that way: no names, emails,
  account IDs, or notes about individual readers in the catalog.

## Commands

```bash
npm run dev        # local desk on :3100
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run start      # serve the production build on :3100
```
