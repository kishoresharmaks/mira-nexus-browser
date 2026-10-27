# Mira — Unique Feature Plan (Anti-Feed Browser Differentiators)

This document maps out 12 novel features designed specifically for **Mira**. None of these exist as native, default experiences in mainstream mobile browsers (Chrome, Safari, Firefox, Edge, Brave, Opera, Arc Mobile, SigmaOS).

---

## 1. Feature Matrix & Novelty Analysis

| # | Feature | Concept | Prior Art / Why Absent in Browsers | Effort | Feasibility | Risk |
|---|---|---|---|---|---|---|
| 1 | **Trail Postcards** | Export a complete session as a beautifully formatted graphic (dot row, page titles, hosts, quotes) via native share. | No browser exports sessions as visual artifacts; share is link-only or single screenshot. | **Medium** | High (`react-native-view-shot`) | Low |
| 2 | **Trail Marginalia (Notes)** | Add per-page or per-trail contextual notes ("Why I kept this", key takeaway) saved inline with history. | Vivaldi has notes, but not tied to temporal session trails. | **Low** | High (Extended `TrailPage`) | Low |
| 3 | **Reading Dwell Clock** | Measure active focused reading time per page & trail (auto-paused when backgrounded/idle). | History shows timestamps, not dwell time. Extensions do this, no native mobile browser. | **Low** | High (AppState + Timer) | Low |
| 4 | **Trail Replay Scrubbing** | Interactive timeline scrubber to visually replay the path of a research session step-by-step. | History is a flat list; no browser offers narrative replay. | **Medium** | High (`Animated` / State) | Low |
| 5 | **Second Read (Unfinished Resurfacing)** | Track scroll depth; pages abandoned at 20-70% resurface in an "Unfinished" shelf on Home. | Browsers restore scroll on reopen, but do not curate an "unfinished reading" queue. | **Medium** | High (Injected JS scroll listeners) | Low |
| 6 | **Site Death Watch** | Remembers when a saved trail page 404s/dies; provides instant Wayback Machine / archive lookup. | Browsers display generic error pages without historical context or 1-tap archive fallback. | **Low** | High (`onHttpError` listener) | Low |
| 7 | **Trail Provenance Tagging** | Shows exact origin of every page open ("via Today's page", "via Hacker News", "via Share"). | Browsers track referrer headers for devtools, not user-facing origin UI. | **Low** | High (State plumbing) | Low |
| 8 | **Closing Time Ritual** | Configurable daily "closing time" that archives active trails and switches Home to a peaceful night card. | OS Screen Time blocks apps; no browser offers an in-app closing ritual. | **Low** | High (State + Clock check) | Low |
| 9 | **Trail Map (Constellation)** | Visual 2D node map of a browsing session grouped by domain clusters and time sequence. | Arc has space tabs, but no session cluster graph natively on mobile. | **Medium** | High (`react-native-svg`) | Medium |
| 10 | **Account-Free QR Trail Handoff** | Generate a dense QR code encoding a whole trail's structure to transfer to another device without cloud sync. | Browsers require cloud accounts (Chrome Sync, iCloud) to hand off session groups. | **Medium** | High (`react-native-qrcode-svg`) | Low |
| 11 | **Local Full-Text Trail Indexing** | Local SQLite FTS5 search across the body text of saved trail pages (100% on-device). | Mobile browsers search history titles/URLs only, never full body text. | **High** | Medium (`expo-sqlite` + JS extraction) | Medium |
| 12 | **Focus Room Mode** | Lock a trail into a distraction-free reader room with only trail navigation (no address bar/new tabs). | Safari Reader removes site UI; Focus Room locks the session boundary. | **Medium** | High (UI Mode toggle) | Low |

---

## 2. Recommended Roadmap

### Milestone 1.1: "The Trail Edition" (Recommended Next)
Focuses on making trails feel like permanent, shareable personal artifacts rather than ephemeral history.

1. **Trail Postcards** — Generate PNG/PDF cards of any trail to share or save to photos.
2. **Trail Marginalia** — Add quick notes to pages inside a trail.
3. **Reading Dwell Clock** — Display actual reading duration on trail cards and detail views.
4. **Trail Provenance** — Show "via Today", "via Search", or parent page in the toolbar menu.
5. **Trail Replay** — Add a timeline scrubber in the trail detail sheet.

*Estimated Scope:* 1–2 weeks | *Dependencies:* None (all local).

---

### Milestone 1.2: "Memory & Longevity"
1. **Second Read Shelf** — Scroll depth tracking and automatic resurfacing on Home.
2. **Site Death Watch** — Archived link recovery when a saved trail link fails.
3. **Trail Map (Constellation)** — SVG visual layout of multi-branch browsing sessions.
4. **Closing Time Ritual** — Evening transition and session summary.

---

### Milestone 1.3: "Local Intelligence"
1. **Account-Free QR Trail Handoff** — Share trails cross-device via compressed QR payloads.
2. **Local Full-Text Search** — On-device SQLite FTS5 index for saved trail content.
3. **Focus Room Mode** — Dedicated single-session reading view.

---

## 3. Implementation Plan for Milestone 1.1

### Phase 1: Data Model Extensions (`src/types.ts` & `src/lib/trails.ts`)
- Extend `TrailPage`:
  ```ts
  export type TrailPage = {
    id: string;
    title: string;
    url: string;
    host: string;
    visitedAt: number;
    dwellMs?: number;      // Reading time in milliseconds
    note?: string;         // User annotation
    provenance?: string;   // e.g., 'today' | 'search' | 'share' | 'shortcut' | 'link'
  };
  ```
- Update `normalizeTrails()` in `src/lib/trails.ts` to preserve `dwellMs`, `note`, and `provenance` safely during storage hydration.

### Phase 2: Dwell Clock Engine (`src/app/index.tsx`)
- Maintain active tab timer with `AppState` awareness (`active` -> count, `background` -> pause).
- Accumulate `dwellMs` into active tab and flush to current `TrailPage` on navigation/tab switch.

### Phase 3: Marginalia & Provenance UI
- Add note button to `MenuSheet.tsx` and `TabsSheet.tsx`.
- Allow editing page notes directly from `TrailsSheet.tsx`.
- Display provenance badge (e.g., `via Today's Page`) in `BrowserToolbar.tsx`.

### Phase 4: Trail Postcards Generator (`src/components/TrailPostcard.tsx`)
- Build an off-screen typographic postcard component using `Instrument Serif` and `Instrument Sans`.
- Capture view using `react-native-view-shot` and open system share dialog with `expo-sharing`.

### Phase 5: Trail Replay Scrubber (`src/components/TrailReplay.tsx`)
- Add interactive step-by-step slider inside `TrailsSheet.tsx` to scrub through a session's history chronologically.

---

## 4. Privacy & Play Store Compliance

- **No Remote Data:** All notes, dwell metrics, and postcards are processed 100% locally on device.
- **Data Safety Form:** Unchanged (still "No data collected").
- **Permissions:** No new Android permissions required for Milestone 1.1.
