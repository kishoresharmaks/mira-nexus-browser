# Building and releasing Mira

There are two independent release paths:

| Path | Output | Use |
| --- | --- | --- |
| GitHub Actions | Signed release APK + SHA-256 | Testers, sideloading, device QA |
| EAS or local Gradle | Signed `.aab` | Google Play upload |

Both read the same Expo config. The app version, Android `versionCode`, catalog
URL, and signing key must be chosen deliberately for each path.

---

## 1. Versioning model

`app.json` is the source of truth for the installed app:

- `expo.version` is the user-visible version, for example `1.0.0`.
- `expo.android.versionCode` is the integer Android and Play use to order
  updates. It must increase for every Play upload and can never be reused.

The CI workflow overrides both values in its own checkout; it does not commit
them back. A tag such as `v1.2.0` produces version `1.2.0`. The default
`versionCode` is the GitHub Actions run number. That is fine for sideloaded test
APKs, but it is not a Play versioning strategy.

For Play, set the values explicitly before building the AAB:

```bash
node scripts/ci/apply-version.mjs --version 1.2.0 --code 12
```

Then commit the `app.json` change, or run the command immediately before the
build. Keep a simple rule: every Play upload gets a higher `versionCode` than
every previous upload, including internal and closed tracks.

Tag releases for testers:

```bash
git tag v1.2.0
git push origin v1.2.0
```

---

## 2. One-time GitHub setup

### 2.1 Push the repository

The workflow lives at `.github/workflows/android-release.yml`. GitHub only runs
it after the repository and workflow exist on the remote.

```bash
git remote -v
git push origin main
```

Open **Actions** in the repository and enable workflows if GitHub asks.

### 2.2 Set the catalog URL

The app bakes `EXPO_PUBLIC_CATALOG_URL` in at bundle time. Add it as a repository
variable, not a secret; it is a public endpoint:

```bash
gh variable set EXPO_PUBLIC_CATALOG_URL \
  --body "https://catalog.example.com/api/catalog"
```

Or use **Settings → Secrets and variables → Actions → Variables → New repository
variable**.

If the variable is empty, the workflow still builds, but the APK uses only the
bundled catalog. It prints a warning in the run summary. The URL must start with
`https://`; the workflow fails early otherwise.

### 2.3 Optional signing secrets

Without signing secrets, the workflow builds a **release** APK (Hermes, R8,
minified) signed with Expo's debug key. That is enough for testers, but:

- It cannot update an app installed from Play.
- It cannot update a build signed with a different key.
- Testers may need to uninstall the old copy before installing a new one.

For a stable tester identity, add a dedicated upload keystore. See
[Signing](#3-signing) below.

---

## 3. Signing

### 3.1 Decide on one key strategy

Android requires every update to be signed by the same key (or by a key Google
manages through Play App Signing). Two common setups:

**A. Play App Signing + your upload key (recommended for this repo).** Google
holds the app-signing key; you hold an upload key. Use that same upload key for
the CI APK and for the Play AAB. Testers can move to the Play build without
uninstalling.

**B. EAS-managed credentials for Play, separate CI key for testers.** Easier if
you already use EAS, but the two builds have different signatures. Testers must
uninstall the CI APK before installing the Play version.

Do not mix keys within one distribution channel. Losing the upload key is
recoverable through Play Console; losing an app-signing key that is not backed
up is not.

### 3.2 Create the upload keystore

Run this once, on a trusted machine, and keep the file out of the repository:

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore mira-upload.keystore \
  -alias mira-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Use a long, unique store password. Back up:

- `mira-upload.keystore`
- the store password
- the key alias
- the key password

Keep two offline copies and a password-manager entry. A keystore in the repo or
in a build artifact is a leaked keystore.

Check it:

```bash
keytool -list -v -keystore mira-upload.keystore -alias mira-upload
```

### 3.3 Add the secrets to GitHub

Base64-encode the keystore without line breaks.

Linux:

```bash
base64 -w0 mira-upload.keystore > mira-upload.keystore.b64
```

macOS:

```bash
base64 -i mira-upload.keystore | tr -d '\n' > mira-upload.keystore.b64
```

Windows PowerShell:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("mira-upload.keystore")
) | Set-Content -NoNewline mira-upload.keystore.b64
```

Add four repository secrets:

```bash
gh secret set ANDROID_KEYSTORE_BASE64 < mira-upload.keystore.b64
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS
gh secret set ANDROID_KEY_PASSWORD
```

On Windows PowerShell, `<` is not supported; pipe the file instead:

```powershell
Get-Content -Raw mira-upload.keystore.b64 | gh secret set ANDROID_KEYSTORE_BASE64
```

`gh secret set` prompts for the value for the last three. Or use **Settings →
Secrets and variables → Actions → Secrets**.

Verify the names:

```bash
gh secret list
```

Delete the temporary `.b64` file after uploading:

```bash
rm mira-upload.keystore.b64
```

> The workflow passes the passwords to Gradle through environment variables.
> They are never written to `gradle.properties` or the build output. GitHub
> masks secret values in logs.

### 3.4 What the workflow does with them

`scripts/ci/configure-signing.mjs` runs after `expo prebuild`:

- With no keystore secret: leaves Expo's debug signing on the release build and
  labels the release notes `debug key (sideload only)`.
- With all four secrets: decodes the keystore to `android/app/release.keystore`,
  adds a `release` signing config, and points only the `release` build type at
  it. The debug build type stays on the debug key.

If only some secrets are present, the workflow fails with the missing names
rather than silently producing a debug-signed build.

---

## 4. Build the test APK

### 4.1 Tag build

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow:

1. Checks out the tagged commit.
2. Installs Node 22, Java 17, the Android SDK, and Gradle.
3. Runs `npm ci`.
4. Resolves the version from the tag (or the manual input).
5. Runs `expo prebuild --platform android --clean`.
6. Applies the optional signing key.
7. Runs `./gradlew :app:assembleRelease`.
8. Verifies the APK signature with `apksigner`.
9. Uploads the APK and `.sha256` as a workflow artifact.
10. Creates a GitHub Release named after the tag and attaches both files.

Open **Actions → Android test APK → the run → Artifacts**, or the **Releases**
page. The APK is named:

```text
mira-1.0.0-<run-number>.apk
```

### 4.2 Manual build

Use **Actions → Android test APK → Run workflow** and optionally set:

| Input | Meaning |
| --- | --- |
| `version` | Version name; defaults to the tag, then `package.json` |
| `version_code` | Android `versionCode`; defaults to the workflow run number |
| `catalog_url` | Overrides the repository variable for this run |

A manual run uploads an artifact but does not create a GitHub Release. That is
intentional: only tags publish releases.

### 4.3 Install the APK

Download it on the Android device and open it, allowing installs from the
browser or file manager when prompted. Or use `adb`:

```bash
adb install -r mira-1.0.0-42.apk
```

If Android reports a signature mismatch:

```bash
adb uninstall com.mira.browser
adb install mira-1.0.0-42.apk
```

Uninstalling removes local history, trails, shortcuts, theme choice, and the
cached catalog. It does not affect the catalog server.

### 4.4 Verify the build

```bash
apksigner verify --verbose --print-certs mira-1.0.0-42.apk
```

The certificate should say `CN=Android Debug` only when you deliberately built
without signing secrets. Otherwise it should show your upload key's distinguished
name.

Compare the checksum:

```bash
sha256sum -c mira-1.0.0-42.apk.sha256
```

On Windows PowerShell:

```powershell
Get-FileHash .\mira-1.0.0-42.apk -Algorithm SHA256
```

---

## 5. Build the Play bundle

The Play Store needs an Android App Bundle (`.aab`), not an APK. The existing
[`eas.json`](../eas.json) production profile builds an `.aab` and submits to the
internal track. That path is documented in [PLAY_STORE.md](../PLAY_STORE.md).

If you want the same upload key as the CI APK, build the bundle locally:

### 5.1 Set the version

```bash
node scripts/ci/apply-version.mjs --version 1.2.0 --code 12
```

Commit the resulting `app.json` change if this is a release commit.

### 5.2 Generate the native project

```bash
npx expo prebuild --platform android --clean
```

### 5.3 Add the keystore

Set the four signing variables in the shell. Linux/macOS:

```bash
export ANDROID_KEYSTORE_BASE64="$(base64 -w0 mira-upload.keystore)"
export ANDROID_KEYSTORE_PASSWORD='your-store-password'
export ANDROID_KEY_ALIAS='mira-upload'
export ANDROID_KEY_PASSWORD='your-key-password'

node scripts/ci/configure-signing.mjs
```

Windows PowerShell:

```powershell
$env:ANDROID_KEYSTORE_BASE64 = [Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("mira-upload.keystore")
)
$env:ANDROID_KEYSTORE_PASSWORD = 'your-store-password'
$env:ANDROID_KEY_ALIAS = 'mira-upload'
$env:ANDROID_KEY_PASSWORD = 'your-key-password'

node scripts/ci/configure-signing.mjs
```

### 5.4 Build the bundle

Linux/macOS:

```bash
cd android
./gradlew :app:bundleRelease --no-daemon
```

Windows:

```powershell
cd android
.\gradlew.bat :app:bundleRelease --no-daemon
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

### 5.5 Upload

In Play Console, create or open the app, go to **Testing → Internal testing**,
and upload the `.aab`. Play validates the version code and signing certificate.
Promote through closed testing to production when the release checklist in
[PLAY_STORE.md](../PLAY_STORE.md) is complete.

> If you use EAS-managed credentials for Play, do not use the locally built
> `.aab` with the CI keystore for the same listing. Choose one key and keep it.

---

## 6. Workflow reference

| Item | Value |
| --- | --- |
| Workflow | `.github/workflows/android-release.yml` |
| Triggers | Tags matching `v*`; manual dispatch |
| Runner | `ubuntu-latest` |
| Node | 22 |
| Java | 17 (Temurin) |
| Android | SDK platform 37.0 and build tools 37.0.0 installed explicitly; NDK resolved by Gradle |
| Gradle | Wrapper in the generated `android/` project, Gradle cache via `gradle/actions/setup-gradle` |
| Build | `:app:assembleRelease` |
| APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Artifact retention | 30 days |
| Release permissions | `contents: write` |
| Catalog URL | `inputs.catalog_url` → `vars.EXPO_PUBLIC_CATALOG_URL` → bundled |
| Signing | Four secrets, or Expo debug key |

Repository settings:

| Name | Type | Required |
| --- | --- | --- |
| `EXPO_PUBLIC_CATALOG_URL` | Variable | No, but production testers should have it |
| `ANDROID_KEYSTORE_BASE64` | Secret | No |
| `ANDROID_KEYSTORE_PASSWORD` | Secret | No |
| `ANDROID_KEY_ALIAS` | Secret | No |
| `ANDROID_KEY_PASSWORD` | Secret | No |

---

## 7. Troubleshooting CI

### The workflow does not appear

- The workflow file must be on the default branch for `workflow_dispatch` to
  show in the UI. Tag builds work once the file is on the pushed tag.
- Check **Actions** is enabled for the repository.

### `npm ci` fails

The lockfile and `package.json` disagree. Run `npm install` locally, commit the
updated `package-lock.json`, and push. Do not use `npm ci --force` in CI.

### Gradle cannot find the Android SDK or NDK

The workflow installs the SDK platform, build tools, and accepts licenses. If a
specific NDK is missing, Gradle downloads it on the first run; the first build is
therefore slower. Check the failing task in the log. For a local equivalent:

```bash
sdkmanager "platforms;android-37.0" "build-tools;37.0.0" "ndk;27.1.12297006"
```

The exact versions come from the Expo SDK 58 template. Do not hard-code
different ones unless you also update `android/` through prebuild. Expo SDK 58
defaults to `compileSdk 37`, `targetSdk 36`, `minSdk 24`, build tools `37.0.0`,
and NDK `27.1.12297006`.

### Gradle runs out of memory

The workflow sets `-Xmx4g`. If the runner still reports an OOM, reduce the
architectures for a test build:

```bash
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

That produces an APK for modern physical devices only; it will not install on an
x86_64 emulator.

### Windows: the C++ build fails on a long path

A local release build on Windows can stop in `:app:buildCMakeRelWithDebInfo` with:

```
ninja: error: Stat(...RNGestureHandlerDetectorShadowNode.cpp.o):
Filename longer than 260 characters
```

The generated object path under `android/app/.cxx` is longer than the Win32
limit. Linux runners in CI use paths well under it, so this is local only. Build
from a short root such as `C:\mira`, or use the CI workflow. Enabling Windows
long paths does not reliably help because the failing tool is `ninja`. A short
clone also avoids editing generated files:

```powershell
git clone <repository> C:\mira
cd C:\mira
npm ci
npx expo prebuild --platform android --no-install --clean
```

### Signing fails

- Confirm all four secrets exist and have no leading/trailing spaces.
- Decode the base64 locally and inspect it:

  ```bash
  base64 -d mira-upload.keystore.b64 > check.keystore
  keytool -list -keystore check.keystore
  ```

- Confirm `ANDROID_KEY_ALIAS` matches the alias in the keystore, not the file
  name.
- If the password contains a shell character, set it in the GitHub UI rather
  than pasting a shell command; the workflow passes it as an environment
  variable and does not interpret it.

### The APK installs but opens with the bundled catalog

`EXPO_PUBLIC_CATALOG_URL` was empty or invalid when Metro bundled the app.
Environment variables are inlined at build time; changing the GitHub variable
does not change an existing APK. Set the URL, rerun the workflow, and install
the new build. Confirm the endpoint with `curl` first.

### The release was not created

- The build must run from a tag matching `v*`, not a branch.
- The workflow needs `permissions: contents: write`.
- If the release already exists, the workflow uploads with `--clobber` instead
  of failing.
- A manual dispatch only produces an artifact.

---

## 8. Security notes

- Never commit `*.keystore`, `*.jks`, passwords, or `.b64` files. The repository
  `.gitignore` already excludes common keystore extensions.
- Keep the keystore and passwords in a password manager and two offline copies.
- Restrict who can push tags and edit repository secrets. A tag build publishes
  a public artifact.
- If the upload key leaks, reset it in Play Console (Play App Signing) and
  generate a new keystore. If you are not using Play App Signing, a leaked
  signing key compromises the listing.
- The APK contains no server secrets. The catalog URL is public. Never put an
  AdMob account password, MongoDB URI, or admin password in the app.
- Signing happens on GitHub's runner. The keystore exists only for the duration
  of the job and is not uploaded as an artifact.
- Review the workflow diff before tagging. A malicious change to the workflow
  can exfiltrate secrets.

---

## 9. File reference

| File | Purpose |
| --- | --- |
| `.github/workflows/android-release.yml` | Tag/manual APK build, signature check, artifact, GitHub Release |
| `scripts/ci/apply-version.mjs` | Writes version and versionCode into `app.json` |
| `scripts/ci/configure-signing.mjs` | Decodes the upload keystore and patches the release build type |
| `eas.json` | EAS development/preview/production profiles |
| `app.json` | Expo name, package, version, versionCode, plugins, AdMob IDs |
| `docs/DEPLOYMENT.md` | VPS admin deployment and catalog URL setup |
| `PLAY_STORE.md` | Listing copy, declarations, Play checklist |
