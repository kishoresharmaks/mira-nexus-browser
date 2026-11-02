# VPS deployment for Mira

This is the complete production runbook for the Mira catalog desk: one Next.js
container behind Caddy, with the catalog stored in MongoDB Atlas. Follow it from
top to bottom on a fresh Ubuntu server. Nothing else in the repository has to be
read to finish the deployment.

Caddy terminates HTTPS, obtains and renews certificates automatically, and
proxies to the app over the private Compose network. The catalog itself lives in
MongoDB Atlas, so rebuilding or replacing the VPS never loses a draft or a
published revision.

```
Internet
   │  HTTPS 443
   ▼
Caddy  ──HTTP :3000──►  admin (Next.js standalone, non-root)
                             │
                             └──TLS──►  MongoDB Atlas (mira.catalog)
```

What runs where:

| Piece | Where | Persistence |
| --- | --- | --- |
| Admin container | VPS, Docker | Stateless; rebuild anytime |
| Caddy | VPS, Docker | `caddy_data` volume holds TLS state |
| Catalog | MongoDB Atlas | Atlas-managed, independent of the VPS |
| App feed | `https://<domain>/api/catalog` | Read-only, CORS-enabled, cached |

The app never talks to the admin UI. It only reads the published feed. The
password, session secret, and MongoDB URI never leave the server.

## How to use this file

| Phase | Section | Time |
| --- | --- | --- |
| Create the database | [2](#2-create-the-atlas-cluster) | 10 min |
| Point DNS | [3](#3-point-dns-at-the-vps) | 5 min + propagation |
| Prepare the server | [4](#4-prepare-the-vps) | 15 min |
| Deploy and verify | [5](#5-deploy-the-admin) | 10 min |
| Connect the app | [6](#6-connect-the-app) | 5 min |
| Backups and monitoring | [7](#7-day-two-operations), [8](#8-monitoring) | 15 min |

You need shell access to the VPS, a domain, and a MongoDB Atlas account. The
first deploy takes about an hour including DNS and the Docker build.
`PLAY_STORE_PUBLISHING.md` covers the app release that consumes this feed.

---

## 1. What you need

- A VPS with Ubuntu 24.04 LTS, 2 GB RAM, and a public IPv4 address. A 1 vCPU /
  1 GB instance is enough for this desk, but 2 GB leaves room for Docker and
  builds.
- A domain or subdomain you control, for example `catalog.example.com`.
- A MongoDB Atlas account and cluster. The free M0 tier works.
- SSH access to the VPS.
- The repository pushed to a Git host the VPS can read.

Examples below assume:

| Value | Example |
| --- | --- |
| Repository | `/opt/mira` |
| Domain | `catalog.example.com` |
| Atlas database | `mira` |
| Atlas collection | `catalog` |
| Admin user | `deploy` |

Replace every example value with your own.

---

## 2. Create the Atlas cluster

1. Create a cluster in the region closest to the VPS.
2. Open **Database Access** → **Add New Database User**.
   - Authentication: password.
   - Role: **Read and write to database** → `mira`. Do not give this user
     `atlasAdmin` or cluster-wide administrative roles.
3. Open **Network Access** → **Add IP Address** and add the VPS public IPv4
   address as a `/32` entry. Do not use `0.0.0.0/0` for a production desk.
4. Open **Database** → **Connect** → **Drivers** and copy the `mongodb+srv://`
   connection string.
5. Replace the password placeholder. If the password contains `@`, `:`, `/`, or
   `?`, URL-encode it first.
6. Keep the database name in the URI if Atlas includes it, for example:

   ```text
   mongodb+srv://mira-admin:encoded-password@cluster0.example.mongodb.net/mira?retryWrites=true&w=majority&appName=mira-admin
   ```

The admin creates the `catalog` document on first read if it does not exist. It
never needs a manual collection or index setup.

> **Atlas M0 note:** free clusters pause after a period of inactivity. The
> `/api/health` check keeps the desk active, but a paused cluster makes the
> first request slow while it resumes. For an always-on production desk, use a
> paid tier or accept the occasional cold start.

---

## 3. Point DNS at the VPS

Create these records at your DNS provider:

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| `A` | `catalog` | VPS IPv4 address | DNS only (grey cloud) for first issue |
| `AAAA` | `catalog` | VPS IPv6 address, if you have one | DNS only |

If you use Cloudflare, keep the record **DNS only** until Caddy has issued a
certificate. A proxied record can hide the HTTP-01 challenge or force a
different TLS mode. After the certificate works, you may enable the proxy and
set SSL/TLS to **Full (strict)**. Do not use **Flexible**.

Verify from your own machine:

```bash
dig +short catalog.example.com
```

It must return the VPS address, not a parking page or a stale record.

---

## 4. Prepare the VPS

### 4.1 First login and updates

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
timedatectl set-timezone UTC
```

### 4.2 Create a deploy user

```bash
adduser --gecos "" deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

Choose a strong account password. SSH password login is disabled below, but
`sudo` still asks for this password.

The account has no SSH key yet, so install your public key from the root
session. Paste the contents of your local `~/.ssh/id_ed25519.pub` (or
`id_rsa.pub`):

```bash
echo 'ssh-ed25519 AAAA... you@laptop' > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

From your computer, confirm key login before changing `sshd_config`:

```bash
ssh deploy@YOUR_VPS_IP
```

From here on, run commands as `deploy`. Privileged steps use `sudo`. Edit
`/etc/ssh/sshd_config`:

```bash
sudo nano /etc/ssh/sshd_config
```

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH and keep the current session open until a second session succeeds:

```bash
sudo systemctl restart ssh
```

### 4.3 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo ufw status
```

Only ports 22, 80, and 443 should be exposed. Docker publishes ports by writing
its own firewall rules, so do not add `ports:` entries to Compose for anything
that should stay private. The admin container uses `expose`, not `ports`.

> If another web server already listens on 80/443, stop and disable it before
> starting Caddy (`systemctl disable --now nginx apache2`).

### 4.4 Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```

Log out and back in so the group change applies, then check:

```bash
docker --version
docker compose version
```

Enable Docker at boot (the installer normally does this):

```bash
sudo systemctl enable --now docker
```

### 4.5 Optional host hardening

```bash
sudo apt install -y unattended-upgrades fail2ban
sudo dpkg-reconfigure --priority=low unattended-upgrades
sudo systemctl enable --now fail2ban
```

Keep the default fail2ban SSH jail or add one for repeated admin login failures.
The admin already rate-limits login attempts per process; fail2ban adds a host
level backstop.

---

## 5. Deploy the admin

### 5.1 Clone the repository

```bash
sudo mkdir -p /opt/mira
sudo chown deploy:deploy /opt/mira
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPO.git /opt/mira
cd /opt/mira
```

Use a deploy key or a read-only token if the repository is private. Never put a
personal access token in the remote URL on a shared host.

### 5.2 Create the production environment file

```bash
cd /opt/mira/admin
cp .env.docker.example .env
chmod 600 .env
```

Generate two independent secrets:

```bash
openssl rand -hex 32   # ADMIN_PASSWORD
openssl rand -hex 32   # ADMIN_SESSION_SECRET
```

Edit `.env`:

```dotenv
ADMIN_DOMAIN=catalog.example.com
ADMIN_PASSWORD=<the first 64-character value>
ADMIN_SESSION_SECRET=<the second 64-character value>
MONGODB_URI=mongodb+srv://mira-admin:encoded-password@cluster0.example.mongodb.net/mira?retryWrites=true&w=majority&appName=mira-admin
MONGODB_DB=mira
MONGODB_COLLECTION=catalog
```

Rules:

- `ADMIN_PASSWORD` must be at least 8 characters. Use the 64-character value.
- `ADMIN_SESSION_SECRET` must be at least 32 characters. Rotating it signs out
  every existing session.
- Do not add `NODE_ENV`; Compose sets it to `production`.
- Do not add `MIRA_DEV_FILE_STORE`; the production container ignores it and
  requires MongoDB.
- Never commit `.env`. It is ignored by both Git and the Docker build context.

Check that Compose sees the values without printing secrets:

```bash
docker compose config --quiet
```

### 5.3 Build and start

```bash
docker compose build
docker compose up -d
docker compose ps
```

The first build takes a few minutes. The admin image is a Next.js standalone
runtime running as UID 1001, not as root. The container health check waits for up
to 30 seconds before its first probe, so `docker compose ps` may show
`health: starting` briefly.

Watch Caddy obtain the certificate:

```bash
docker compose logs -f caddy
```

Look for `certificate obtained successfully` and your domain. Press `Ctrl+C`
to stop following; the containers keep running.

### 5.4 Verify

```bash
curl -fsS https://catalog.example.com/api/health
```

Expected:

```json
{
  "ok": true,
  "service": "mira-catalog-admin",
  "checks": { "auth": "ok", "storage": "ok" },
  "latencyMs": 42,
  "time": "..."
}
```

Then:

1. Open `https://catalog.example.com/` in a private browser window.
2. Sign in with `ADMIN_PASSWORD`.
3. Confirm the storage badge says `mira.catalog` (not "not configured").
4. Change a harmless draft field and press **Publish**.
5. Fetch the public feed:

   ```bash
   curl -fsS https://catalog.example.com/api/catalog | head
   ```

   It must return JSON with a `revision` and an `access-control-allow-origin: *`
   header.

If the health check returns `503`, wait 30 seconds and retry once; the admin
container starts in a few seconds and the first Atlas connection can take a
moment. If it still fails, see [Troubleshooting](#11-troubleshooting).

### 5.5 Container details

| Setting | Value |
| --- | --- |
| Admin port | `3000`, internal only |
| Caddy ports | `80`, `443` TCP, `443` UDP (HTTP/3) |
| Admin user | `nextjs`, UID 1001 |
| Health check | `GET /api/health` every 30 s, 12 s timeout, 30 s start period |
| Restart policy | `unless-stopped` |
| Log rotation | 10 MB × 3 per container |

The admin container has no writable host mount. The catalog is in Atlas, and
the only persistent Docker volumes are Caddy's TLS state and configuration.

---

## 6. Connect the app

`EXPO_PUBLIC_CATALOG_URL` is read at build time, so set it before producing the
binary that testers or Play users install.

```bash
EXPO_PUBLIC_CATALOG_URL=https://catalog.example.com/api/catalog
```

Where to set it:

| Build path | Where |
| --- | --- |
| Local development | `.env.local` in the repository root |
| GitHub Actions APK/AAB | Repository variable `EXPO_PUBLIC_CATALOG_URL` (Settings → Secrets and variables → Actions → Variables) |
| Manual Gradle build | Export the variable in the shell before `./gradlew` |
| EAS build (optional) | `eas secret:create` or the EAS environment for the build profile |

The value must use `https://`. The app rejects a non-HTTPS catalog URL and keeps
its bundled catalog.

The app caches the feed for about an hour and rechecks on foreground or when
Search settings opens. A newly published revision can take that long to reach a
device. Reinstall or wait for the cache window when verifying a change.

Test the feed the way the app sees it:

```bash
curl -i https://catalog.example.com/api/catalog
```

Confirm:

- `HTTP/2 200`
- `content-type: application/json`
- `access-control-allow-origin: *`
- a valid `revision`
- no reader data, only public catalog fields

When this returns `200`, keep this file open only for day-two operations. The
app release that uses this feed is covered in
[`PLAY_STORE_PUBLISHING.md`](PLAY_STORE_PUBLISHING.md).

---

## 7. Day-two operations

### 7.1 Logs

```bash
cd /opt/mira/admin
docker compose logs -f admin
docker compose logs -f caddy
docker compose logs --tail=200 admin
```

Caddy logs requests; the admin logs store errors. Neither logs the MongoDB URI
or the admin password. If you add logging, keep it that way.

### 7.2 Restart

```bash
cd /opt/mira/admin
docker compose restart admin
```

Caddy keeps running and returns `502` for the few seconds the admin is down.

### 7.3 Update to a new release

```bash
cd /opt/mira
git fetch --tags
git checkout v1.0.1          # or: git pull --ff-only
cd admin
docker compose build --pull
docker compose up -d
docker image prune -f
curl -fsS https://catalog.example.com/api/health
```

The build uses the lockfile, so a review of `package-lock.json` is part of the
release. If the health check fails, roll back.

### 7.4 Roll back

```bash
cd /opt/mira
git checkout v1.0.0
cd admin
docker compose build
docker compose up -d
curl -fsS https://catalog.example.com/api/health
```

The catalog document is unchanged by a rollback. If a release changed the
schema, restore the backup taken before the upgrade.

### 7.5 Backups

The catalog is small but it is the only copy of the published revision. Choose
one of these:

**Atlas Cloud Backup (paid tiers).** Enable continuous or daily backups in
Atlas and set a retention window. Test a restore into a temporary cluster before
you need it.

**`mongodump` on the VPS.** Works on M0 and costs nothing. Create
`/opt/mira/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /opt/mira
mkdir -p backups
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

docker run --rm \
  --env-file /opt/mira/admin/.env \
  -v /opt/mira/backups:/backup \
  mongo:8 \
  sh -c 'mongodump --uri="$MONGODB_URI" --archive="/backup/mira-'"$STAMP"'.archive" --gzip'

find /opt/mira/backups -type f -name 'mira-*.archive' -mtime +14 -delete
```

```bash
chmod 700 /opt/mira/backup.sh
```

Run it once manually, then add a cron entry:

```cron
0 3 * * * /opt/mira/backup.sh >> /home/deploy/mira-backup.log 2>&1
```

The archive contains the full catalog document. Store a copy off the VPS
(object storage or another machine); a backup on the same disk is not a backup.

**Restore** into the configured database:

```bash
cd /opt/mira
docker run --rm \
  --env-file admin/.env \
  -v /opt/mira/backups:/backup \
  mongo:8 \
  sh -c 'mongorestore --uri="$MONGODB_URI" --archive="/backup/mira-2026-11-01T03-00-00Z.archive" --gzip --drop'
```

`--drop` replaces the existing collection. Take a fresh backup first, and tell
the editor that the draft and published revision will both rewind.

### 7.6 Rotate credentials

**Admin password:**

```bash
cd /opt/mira/admin
# edit .env, change ADMIN_PASSWORD
docker compose up -d
```

**Session secret:** change `ADMIN_SESSION_SECRET` and run:

```bash
cd /opt/mira/admin
docker compose up -d
```

Every browser session is invalidated immediately.

**Atlas password:** rotate it in Atlas, update the URL-encoded value in
`MONGODB_URI`, then `docker compose up -d`. Keep the old password until the
health check passes.

---

## 8. Monitoring

Point an uptime service (UptimeRobot, Better Stack, Healthchecks.io, or your own
monitor) at:

```text
https://catalog.example.com/api/health
```

Alert when the response is not `200` or when `ok` is not `true`. The body names
only the failed component (`auth` or `storage`); it never includes a connection
string or an error trace.

Optional host checks:

```bash
cd /opt/mira/admin
docker compose ps
df -h /
free -m
docker system df
```

Alert on disk above 80%, memory exhaustion, or a container that restarts
repeatedly.

---

## 9. Security checklist

- [ ] DNS points only at this VPS; no stale A records.
- [ ] Ports 80 and 443 are open; 3000 and 27017 are not.
- [ ] Atlas allows only the VPS `/32`, not the whole internet.
- [ ] The Atlas user has `readWrite` on `mira` only.
- [ ] `admin/.env` is mode `600`, owned by the deploy user, and not in Git.
- [ ] `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are unique and random.
- [ ] Login works over HTTPS only; the session cookie is `Secure`, `HttpOnly`,
      and `SameSite=Lax`.
- [ ] `curl -I https://catalog.example.com/` shows HSTS, `nosniff`,
      `X-Frame-Options: DENY`, and no `Server` header.
- [ ] SSH password login and root login are disabled.
- [ ] Docker and Ubuntu security updates are applied monthly.
- [ ] Backups run on a schedule and a restore has been tested.
- [ ] Uptime monitoring alerts on `/api/health`.
- [ ] The app's catalog URL is the HTTPS feed, not a localhost or HTTP URL.
- [ ] The desk runs as one container. Do not scale it horizontally without
      moving login rate limiting and any future cache to shared storage.

---

## 10. Alternative: deploy on Vercel

The container setup above is the recommended VPS path. The admin still works on
Vercel if you prefer it:

1. Import the repository and set **Root Directory** to `admin`.
2. Framework preset: Next.js. Build command: `npm run build`.
3. Add `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `MONGODB_URI` for
   Production. Add `MONGODB_DB` / `MONGODB_COLLECTION` only if you changed the
   defaults.
4. Allow Vercel's egress in Atlas Network Access, or use Atlas's Vercel
   integration.
5. Deploy and verify `https://<project>.vercel.app/api/health`.
6. Point `EXPO_PUBLIC_CATALOG_URL` at `https://<project>.vercel.app/api/catalog`.

Vercel sets `NODE_ENV=production`, so the secure cookie and MongoDB requirement
behave the same way. The VPS guide's backup, rotation, and monitoring sections
apply to Atlas regardless of where the admin runs.

---

## 11. Troubleshooting

### Caddy cannot obtain a certificate

Check, in order:

```bash
dig +short catalog.example.com
sudo ss -tlnp | grep -E ':(80|443)\b'
docker compose logs --tail=100 caddy
```

Common causes:

- DNS still points elsewhere, or the AAAA record points to an old IPv6 address.
- Another web server owns port 80/443.
- The cloud firewall or provider security group blocks 80/443.
- Cloudflare is proxying with **Flexible** SSL, causing a redirect loop.
- Let's Encrypt rate limit after repeated failed attempts. Wait, fix DNS/ports,
  then retry. For testing, temporarily add
  `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` to the global
  block in `admin/deploy/Caddyfile`, issue a staging certificate, remove it, and
  restart Caddy.

### `502 Bad Gateway`

Caddy is up but the admin is not serving. On first boot this can last a few
seconds while Next.js starts; after that, check the container:

```bash
cd /opt/mira/admin
docker compose ps
docker compose logs --tail=200 admin
```

If the admin container is restarting, read the first error in its log. The most
common cause is a missing or malformed `MONGODB_URI` or `ADMIN_SESSION_SECRET`.

### Health returns `503` with `storage: "unavailable"`

The process is running but Atlas is unreachable. Check:

- The URI in `admin/.env` (URL-encoded password, correct cluster host).
- Atlas **Network Access** contains the VPS's current public IP.
- The Atlas user has `readWrite` on `mira`.
- The cluster is not paused.
- The VPS can resolve and reach `*.mongodb.net`:

  ```bash
  getent hosts cluster0.example.mongodb.net
  ```

Open the login page; the store error panel shows a redacted reason. Fix the
cause and reload; no restart is needed for a network allowlist change.

### Health returns `503` with `auth: "missing"`

`ADMIN_PASSWORD` is shorter than 8 characters, or `ADMIN_SESSION_SECRET` is
shorter than 32. Fix `.env` and run `docker compose up -d`.

### Login appears to succeed but the desk returns to the login page

The session cookie is `Secure` in production. If you open the site over plain
HTTP or through a proxy that terminates TLS without forwarding the original
protocol, the browser drops the cookie. Use `https://` and Caddy's default
`X-Forwarded-Proto` handling; do not put another TLS-terminating proxy in front
without configuring it correctly.

### The app still shows old catalog data

The app caches the feed for about an hour. Confirm the feed changed:

```bash
curl -fsS https://catalog.example.com/api/catalog | grep -o '"revision":[0-9]*'
```

Then wait for the cache window, background and foreground the app, or open
Search settings to trigger a stale check. A build with an empty
`EXPO_PUBLIC_CATALOG_URL` never contacts the server; rebuild with the URL set.

### `No catalog store is configured`

`MONGODB_URI` is not reaching the container. Check:

```bash
cd /opt/mira/admin
docker compose config | sed -n '/environment:/,/^[^ ]/p'
```

Do not print the full config on a shared screen; it contains secrets. Confirm
`.env` exists in `admin/`, the key is spelled `MONGODB_URI`, and there are no
quotes or trailing spaces around the value.

### Disk fills up

```bash
docker system df
docker image prune -f
docker builder prune -f
journalctl --disk-usage
```

Caddy logs rotate at 10 MB × 3. If you added verbose logging, reduce it before
pruning.

---

## 12. File reference

| File | Purpose |
| --- | --- |
| `admin/Dockerfile` | Multi-stage standalone image, non-root runtime, health check |
| `admin/docker-compose.yml` | Admin + Caddy, private network, restart policies |
| `admin/deploy/Caddyfile` | HTTPS, compression, security headers, reverse proxy |
| `admin/.env.docker.example` | Production environment template |
| `admin/lib/store.ts` | MongoDB store and `pingStore()` |
| `admin/app/api/health/route.ts` | Health endpoint used by Docker and uptime checks |
| `admin/next.config.ts` | `output: "standalone"` and security headers |
