# Nexus — A Quieter Browser

Nexus is a privacy-first mobile browser for Android. It opens ordinary websites in a full-screen WebView with no feed, no account, no analytics, and only one small home-screen banner. Your history, trails, shortcuts, search choice, and theme stay on your device.

## Features

- **Trails** — Pages visited within ~25 minutes group into a resumable trail with a dot row on the home screen
- **Five tabs** — Up to five pages stay alive while the app is open; the sixth tab evicts the least-recently-active one
- **Today's page** — One curated page per calendar day, fetched from a public catalog or bundled offline copy
- **Private tabs** — No history, cache bypassed, screen-capture blocked on native builds
- **Search your way** — Private presets (DuckDuckGo, Brave, Startpage, Mojeek, Qwant, Kagi) or any custom HTTPS engine
- **Public discussions** — Optionally shows Hacker News / Lobsters conversation around an article in a native sheet
- **Share intake** — Open links and plain text from any app's share sheet
- **Android home-screen widget** — 4×2 resizable widget with Today's page and shortcuts
- **One quiet banner** — Adaptive home-screen banner via Google AdMob, configurable from a remote catalog, never in the browser or private tabs

## Tech stack

Expo SDK 58, React Native 0.88, React 19, TypeScript, Expo Router. Native modules: `react-native-webview`, `react-native-google-mobile-ads`, `expo-screen-capture`, `expo-sharing`, `expo-font`, `react-native-svg`.

## Project structure

```
src/          App source (Expo Router, components, lib, widgets, theme)
admin/        Next.js catalog desk (search presets, Today pages, ad settings)
catalog/      Canonical defaults for search engines, Today pages, and ads
```

## Requirements

- Node 20+
- Android Studio / Android SDK for local native builds, or EAS for cloud builds
- A physical Android device for share intake, widget, and screen-capture testing

## Getting started

```bash
npm install
npx expo start
```

Open the QR code in Expo Go for core browsing. Share intake, the widget, private-tab screen capture, and AdMob require a development build:

```bash
npx expo run:android
```

## Quality gates

```bash
npx tsc --noEmit      # TypeScript check
npx expo lint         # ESLint
npx expo-doctor       # Dependency + config diagnostics
```

## Release

Push a tag and GitHub Actions builds the signed Android App Bundle:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `.aab` attaches to the GitHub Release for Play Console upload. Setup, signing, and Play Store listing walkthroughs are kept offline.

## Privacy

No account, no feed, no analytics. History, trails, shortcuts, search choice, and theme are stored only on the device. The optional discussion lookup sends only the current page address to Hacker News (Algolia) and Lobsters, and can be disabled.

## License

Private project. Fonts licensed under SIL Open Font License via `@expo-google-fonts`. Brand assets are original.
