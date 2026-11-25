# Nexus â€” Play Store Publishing: End-to-End Guide

Complete step-by-step instructions from generating the upload keystore to
publishing on Google Play. This document is written for Windows + PowerShell
and for the GitHub Actions CI build path used by this repo.

It assumes:
- The repo is at `https://github.com/kishoresharmaks/mira-nexus-browser.git`
- Package ID: `com.nexus.browser`
- Admin catalog desk deployed at: `https://mira.nexusnation.in`
- Support email: `krishkishoreks@gmail.com`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Generate the upload keystore](#2-generate-the-upload-keystore)
3. [Configure app.json (AdMob, catalog URL, signing)](#3-configure-appjson)
4. [Add GitHub Actions secrets & variables](#4-add-github-actions-secrets--variables)
5. [Build the .aab in CI](#5-build-the-aab-in-ci)
6. [Create the Play Console app](#6-create-the-play-console-app)
7. [Configure Play Store listing](#7-configure-play-store-listing)
8. [Upload and submit](#8-upload-and-submit)
9. [Production rollout](#9-production-rollout)

---

## 1. Prerequisites

- A Google Play developer account (you already have one â€” $25 one-time fee)
- Java 17 JDK installed (for `keytool`)
- Git access to the repository
- Ability to sign in to GitHub and Google Play Console

Verify Java is available:

```powershell
java -version
keytool -version
```

---

## 2. Generate the Upload Keystore

Run this **once**, on your local machine. Keep the output file and both
passwords safe â€” you cannot update the app under the same Play listing without
this keystore.

```powershell
keytool -genkeypair -v `
  -keystore nexus-upload.keystore `
  -alias nexus-upload `
  -keyalg RSA -keysize 4096 -validity 10000
```

`keytool` will prompt for:
1. **Keystore password** â€” choose a strong, unique password (save it in a password manager).
2. **First and last name** â€” your name or organization.
3. **Organizational unit, organization, city, state, country code** â€” optional, press Enter to skip.
4. **Key password** â€” press Enter to reuse the keystore password, or set a different one.

### Back up the keystore

```powershell
# Create a backup copy outside the repo
Copy-Item nexus-upload.keystore C:\Users\krish\Documents\nexus-upload.keystore.backup
```

### Never commit the keystore

The repo ignores `*.keystore` and `*.jks` in `.gitignore`. Do not add it to Git.

### Base64-encode for GitHub Actions

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("nexus-upload.keystore")) | Set-Content -NoNewline nexus-upload.keystore.b64
```

After uploading the secret to GitHub, delete `nexus-upload.keystore.b64`.

---

## 3. Configure app.json

Edit `app.json` in the repo root. This is the single source of truth for app
identity, signing metadata, AdMob IDs, and the catalog URL.

### 3.1 AdMob App IDs (REQUIRED â€” replace test IDs)

Current test IDs (do NOT use these in production):

```json
"react-native-google-mobile-ads": {
  "androidAppId": "ca-app-pub-3940256099942544~3347511713",
  "iosAppId": "ca-app-pub-3940256099942544~1458002511",
  "delayAppMeasurementInit": true
}
```

**Production values you must set:**

1. Sign in to [AdMob](https://apps.admob.com/) with your Google account.
2. **Apps â†’ Add app** â†’ "Nexus â€” A Quieter Browser" â†’ Android.
3. Copy the **App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).
4. **Ad units â†’ Add ad unit** â†’ "Banner" â†’ name it "Nexus Home Banner" â†’ copy the **Ad unit ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`).

Update `app.json`:

```json
"react-native-google-mobile-ads": {
  "androidAppId": "ca-app-pub-YOUR_REAL_ANDROID_APP_ID",
  "iosAppId": "ca-app-pub-YOUR_REAL_IOS_APP_ID",
  "delayAppMeasurementInit": true
}
```

The actual banner unit IDs come from the published catalog (admin desk), not
`app.json`. Set those in the admin Advertising tab after deploying the catalog.

### 3.2 Catalog URL (REQUIRED for production builds)

Add or verify this in `app.json` or as an Expo build variable:

```json
"extra": {
  "EXPO_PUBLIC_CATALOG_URL": "https://mira.nexusnation.in/api/catalog"
}
```

If you later deploy the catalog to your own domain, replace the URL with
`https://<your-domain>/api/catalog`. The app reads this at build time; an empty
value means it falls back to the bundled catalog only.

### 3.3 Other app.json fields (verify before build)

| Field | Current value | Action |
|-------|--------------|--------|
| `expo.name` | `Nexus` | Launcher label â€” OK |
| `expo.slug` | `nexus-browser` | OK |
| `expo.scheme` | `nexus` | Deep-link scheme â€” OK |
| `expo.version` | `1.0.0` | User-visible version; bump for updates |
| `expo.android.package` | `com.nexus.browser` | Fixed at first Play upload â€” do not change after |
| `expo.android.versionCode` | `1` | CI overrides per build |
| `expo.android.permissions` | `INTERNET` only in app.json | AdMob adds `AD_ID`, `ACCESS_NETWORK_STATE`, `VIBRATE`, `WAKE_LOCK` via plugin |
| `expo.android.blockedPermissions` | Camera, mic, location, storage, contacts, SMS, notifications, overlay | Keep â€” blocks unneeded permissions |
| `expo.ios.bundleIdentifier` | `com.nexus.browser` | iOS (not yet released) |

### 3.4 Version bump (for future releases)

Edit `expo.version` in `app.json` (e.g. `1.1.0`) before each release tag. The
CI sets `versionCode` from the workflow run number automatically.

---

## 4. Add GitHub Actions Secrets & Variables

Go to your repo on GitHub â†’ **Settings â†’ Secrets and variables â†’ Actions**.

### Secrets (add under the **Secrets** tab)

| Secret name | Value | How to obtain |
|-------------|-------|---------------|
| `ANDROID_KEYSTORE_BASE64` | Base64 string of `nexus-upload.keystore` | Output of step 2 |
| `ANDROID_KEYSTORE_PASSWORD` | Your keystore password | You chose it in step 2 |
| `ANDROID_KEY_ALIAS` | `nexus-upload` | Fixed |
| `ANDROID_KEY_PASSWORD` | Your key password | Same as keystore password unless you set a different one |

Add each with **New repository secret**, paste the value, and click **Add secret**.

### Variables (add under the **Variables** tab)

| Variable name | Value |
|---------------|-------|
| `EXPO_PUBLIC_CATALOG_URL` | `https://mira.nexusnation.in/api/catalog` |

---

## 5. Build the .aab in CI

The repo has a GitHub Actions workflow at `.github/workflows/android-release.yml`
that builds both the APK (for testers) and the `.aab` (for Play) with your
upload key.

### Option A: Push a release tag (recommended)

```powershell
git tag v1.0.0
git push origin v1.0.0
```

CI will:
1. Check out the tag
2. Run `expo prebuild --platform android`
3. Configure signing with your keystore secrets
4. Run `./gradlew :app:assembleRelease` (APK) and `:app:bundleRelease` (AAB)
5. Verify both are signed with the upload key
6. Publish a GitHub Release with:
   - `nexus-1.0.0-<run>.apk`
   - `nexus-1.0.0-<run>.aab`  â† upload this to Play
   - `SHA256SUMS.txt`

### Option B: Manual workflow dispatch

1. Go to GitHub â†’ **Actions â†’ Android release builds**
2. Click **Run workflow**
3. Set `version` (e.g. `1.0.0`), `version_code` (e.g. `1`), and optionally `catalog_url`
4. Download the `.aab` artifact from the completed run

### Verify the release notes

Open the GitHub Release and confirm the notes say **Signing: upload key**.
If they say **debug key (sideload only)**, the four secrets are missing or
incomplete â€” do not upload that `.aab` to Play.

---

## 6. Create the Play Console App

1. Sign in to [Play Console](https://play.google.com/console).
2. **Create app**:
   - App name: `Nexus â€” A Quieter Browser`
   - Default language: English
   - Application type: **App** (not Game)
   - Pricing: **Free**
3. Accept the Developer Distribution Agreement and US export declarations.
4. **App identity** â†’ confirm package name is `com.nexus.browser`.
   - âš ï¸ This is fixed at first upload and **cannot be changed later**.
5. **Play App Signing** â†’ accept when offered on first upload. Google holds the
   app-signing key; your keystore becomes the upload key.

---

## 7. Configure Play Store Listing

### 7.1 Store listing (main page)

| Field | Value |
|-------|-------|
| App name | `Nexus â€” A Quieter Browser` (25 characters) |
| Short description | `A quieter browser: trails, five tabs, private rooms, and one page a day.` (80 chars) |
| Full description | See `PLAY_STORE_PUBLISHING.md` section 2 |
| Category | **Tools** |
| Tags | Browser, Reading, Productivity |
| Pricing | Free, no in-app purchases |
| Content rating | Teen (unrestricted web access) |
| Target audience | 13+, Designed for families: No |

### 7.2 Graphics

Upload from the repo:

| Asset | File | Spec |
|-------|------|------|
| App icon | `assets/icon-512.png` | 512 Ã— 512, 32-bit PNG, â‰¤1 MB |
| Feature graphic | `docs/play/feature-graphic.png` | 1024 Ã— 500, 24-bit PNG, no alpha |
| Phone screenshots | `docs/play/screenshots/01-home.png` â€¦ `09-private.png` | 780 Ã— 1520, 24-bit PNG, no alpha, 8 images in order |

Screenshot order:
1. `01-home.png` â€” home: hero, omnibox, Today's page
2. `02-home-shelves.png` â€” trail, shortcuts, recent pages
3. `03-today.png` â€” Today archive sheet
4. `04-trails.png` â€” Trails sheet with three trails
5. `06-browser.png` â€” real page in browser
6. `07-tabs.png` â€” four tabs in grid
7. `09-private.png` â€” private tab start page
8. `08-discussions.png` â€” discussion sheet over The Slow Web

### 7.3 Privacy policy

URL: `https://mira.nexusnation.in/privacy.html`

This page is publicly reachable and contains the support email
`krishkishoreks@gmail.com`. Paste this exact URL in Play Console â†’ **App content â†’ Privacy policy**.

### 7.4 Ads declaration

- **Contains ads:** Yes â€” one adaptive home-screen banner via Google AdMob
- **Advertising ID:** Yes â€” used by the Google Mobile Ads SDK
- Do **not** label the app as ad-free.

### 7.5 Data safety form

Use the answers from `PLAY_STORE_PUBLISHING.md` section 4:

- Collects/shares user data: **Yes**
  - Web browsing history (current page address only): **No** collected, **Yes** shared (optional discussion lookup)
  - Approximate location: **Yes** (by AdMob SDK), **Yes** shared with Google
  - App interactions: **Yes** (by AdMob SDK), **Yes** shared with Google
  - Device or other IDs (advertising ID): **Yes** (by AdMob SDK), **Yes** shared with Google
  - Other app performance data (diagnostics): **Yes** (by AdMob SDK), **Yes** shared with Google
- Encrypted in transit: **Yes**
- Data deletion: **Yes** (Clear history in-app; Clear storage in Android Settings; reset advertising ID)

### 7.6 Content rating (IARC)

Answer the questionnaire truthfully â€” the app is a browser with unrestricted web
access. Expected rating: **Teen**.

### 7.7 App access

No login, account, invite code, or location restriction.

### 7.8 Support contact

Email: `krishkishoreks@gmail.com`

---

## 8. Upload and Submit

### 8.1 Internal testing (first)

1. Play Console â†’ **Testing â†’ Internal testing â†’ Create new release**
2. Accept **Play App Signing** when prompted
3. Upload `nexus-1.0.0-<run>.aab` from the GitHub Release
4. Add release notes (use the "What's new" text from `PLAY_STORE_PUBLISHING.md` section 2)
5. **Save â†’ Review release â†’ Start rollout to internal testing**
6. Under **Testers**, add email addresses or a Google Group
7. Share the opt-in link with testers
8. Install from the Play link on a physical device and run the device checklist
   (section 9 of `PLAY_STORE_PUBLISHING.md`)

### 8.2 Closed testing (required for new personal accounts)

New personal accounts created after 13 November 2023 must run a closed test with
at least 12 testers for **14 continuous days** before production access.

1. Create a closed track
2. Upload a build with a **new versionCode**
3. Add testers and collect feedback for the required period

### 8.3 Production

1. Play Console â†’ **Production â†’ Create new release**
2. Upload (or promote) the `.aab`
3. Start with a **staged rollout of 10â€“20%**
4. Watch pre-launch report and crash rate for a day
5. Increase rollout to 100%

First review usually takes a few days, up to seven. Updates are often faster.

---

## 9. app.json Configuration Reference

Complete breakdown of every `app.json` field you may need to change:

```json
{
  "expo": {
    "name": "Nexus",
    "slug": "nexus-browser",
    "scheme": "nexus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "backgroundColor": "#F5F1E8",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.nexus.browser",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.nexus.browser",
      "versionCode": 1,
      "allowBackup": false,
      "permissions": ["android.permission.INTERNET"],
      "blockedPermissions": [ ... camera, mic, location, storage, contacts, SMS, notifications, overlay ... ],
      "adaptiveIcon": {
        "backgroundColor": "#14120E",
        "foregroundImage": "./assets/adaptive-icon.png",
        "monochromeImage": "./assets/monochrome-icon.png"
      },
      "predictiveBackGestureEnabled": false,
      "softwareKeyboardLayoutMode": "resize"
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-status-bar",
      "expo-font",
      "expo-system-ui",
      "expo-dev-client",
      "./plugins/with-webview-hardening",
      ["expo-splash-screen", { ... }],
      ["expo-build-properties", { "android": { "usesCleartextTraffic": false, ... } }],
      ["expo-share-intent", { "iosShareExtensionName": "Nexus", "androidIntentFilters": ["text/*"] }],
      ["react-native-android-widget", { ... fonts, widget label "Nexus â€” Today's page", previewImage ... }],
      ["react-native-google-mobile-ads", {
        "androidAppId": "REPLACE_WITH_REAL_ANDROID_APP_ID",
        "iosAppId": "REPLACE_WITH_REAL_IOS_APP_ID",
        "delayAppMeasurementInit": true
      }],
      ["expo-tracking-transparency", { "userTrackingPermission": "..." }]
    ]
  }
}
```

### Fields you must change before production

| Location | Field | Current (test) | Production value |
|----------|-------|----------------|------------------|
| `plugins[11]` | `androidAppId` | `ca-app-pub-3940256099942544~3347511713` | Your real AdMob Android app ID |
| `plugins[11]` | `iosAppId` | `ca-app-pub-3940256099942544~1458002511` | Your real AdMob iOS app ID |
| `extra` | `EXPO_PUBLIC_CATALOG_URL` | (not set) | `https://<your-domain>/api/catalog` |
| `android` | `version` | `1.0.0` | Bump for each release |
| `android` | `versionCode` | `1` | CI sets automatically |

### Fields you must NOT change after first Play upload

| Location | Field | Reason |
|----------|-------|--------|
| `android` | `package` | `com.nexus.browser` â€” fixed at first upload |
| `slug` | `expo.slug` | Affects deep links and EAS project identity |

### Banner unit IDs (set in admin, not app.json)

The banner unit IDs are configured in the admin catalog desk, not in `app.json`:

1. Open `https://mira.nexusnation.in/`
2. Sign in with the admin password (generated on the VM)
3. **Advertising tab** â†’ enter real Android banner unit ID
4. Turn **test mode off**
5. Enable the banner and **Publish**
6. The app reads this from `EXPO_PUBLIC_CATALOG_URL` at runtime

---

## 10. Versioning Rules

- Play rejects a `versionCode` already uploaded on any track.
- CI uses the workflow run number by default (1, 2, 3, â€¦) â€” monotonic per repo.
- Pass `version_code` on a manual run when you need a specific number.
- User-visible `version` comes from the tag (`v1.2.0` â†’ `1.2.0`).
- Never reuse a number after a failed upload.

---

## 11. Quick Reference: Commands

```powershell
# 1. Generate keystore (once)
keytool -genkeypair -v -keystore nexus-upload.keystore -alias nexus-upload -keyalg RSA -keysize 4096 -validity 10000

# 2. Base64-encode for GitHub (once)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("nexus-upload.keystore")) | Set-Content -NoNewline nexus-upload.keystore.b64

# 3. Tag and push to trigger CI build
git tag v1.0.0
git push origin v1.0.0

# 4. Download .aab from GitHub Release, upload to Play Console
```

---

## 12. Files in this repo relevant to publishing

| File | Purpose |
|------|---------|
| `app.json` | App identity, AdMob IDs, splash, widget, AdMob plugin config |
| `PLAY_STORE_PUBLISHING.md` | Full Play Store runbook (listing copy, data safety, IARC, checklist) |
| `PRIVACY.md` | Markdown privacy policy |
| `docs/privacy.html` | Hostable privacy policy (served publicly on the VM) |
| `.github/workflows/android-release.yml` | CI build for APK + AAB |
| `VPS_DEPLOYMENT.md` | Catalog desk deployment (MongoDB Atlas + Caddy on VPS) |
