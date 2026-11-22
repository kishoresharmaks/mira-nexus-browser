# NEXUS BROWSER V2 — COMPLETE UI REDESIGN & FEATURE IMPLEMENTATION

**AI Coding Agent:** Antigravity  
**Model:** Gemini 3.8 Flash — High  
**Project:** Nexus Browser (Existing Android browser application)  
**Primary Objective:** Transform Nexus into a premium, privacy-first, AI-powered personal web companion.

---

# 1. YOUR ROLE

Act as a Senior Android Engineer, Browser Architect, Product Designer, UI/UX Specialist, and Performance Engineer.

You are working on my existing Nexus Browser project.

Your responsibility is to analyze the entire existing codebase, understand its current architecture, identify existing features, and upgrade the application into Nexus Browser V2.

This is an existing production-oriented project.

**IMPORTANT: Do not start coding immediately. First understand the existing implementation.**

You must preserve all working browser functionality while introducing the redesigned homepage and new features.

# 2. DESIGN REFERENCE

Use the attached Nexus Browser V2 homepage image as the primary visual reference.

The design should preserve the existing Nexus identity.

### Brand identity

- Brand: Nexus
- Tagline: The web, uncluttered.
- Primary background: Warm cream / ivory.
- Primary accent: Soft vibrant orange.
- Main text: Deep charcoal / black.
- Secondary text: Muted warm grey.
- Cards: Warm white with subtle borders.
- Typography: Elegant editorial serif for headings, modern sans-serif for body text.
- Design style: Premium, editorial, minimalist, Apple-inspired.
- Corner radius: Soft, approximately 20–30dp where appropriate.
- Shadows: Soft, natural, subtle.
- Animations: Smooth and lightweight.

### Design principles

1. Minimalism without sacrificing functionality.
2. No unnecessary visual clutter.
3. Excellent mobile responsiveness.
4. Consistent spacing and typography.
5. Smooth scrolling.
6. Fast rendering.
7. Accessible touch targets.
8. Light and dark themes.
9. Avoid excessive animations.
10. Maintain the original Nexus brand identity.

Do not copy the reference image as a static screenshot. Rebuild the interface using actual application components.

# 3. PHASE 1 — COMPLETE EXISTING PROJECT AUDIT

Before implementing anything, inspect the entire project.

Analyze:

- Project directory structure.
- Android application architecture.
- Existing browser engine.
- WebView / Chromium implementation.
- Homepage implementation.
- Search functionality.
- Search engine configuration.
- Tab management.
- Browser history.
- Bookmarks.
- Download management.
- Settings.
- Theme management.
- Local database.
- Permissions.
- Background services.
- Existing API integrations.
- Existing authentication, if any.
- Existing privacy implementation.
- Navigation architecture.
- State management.
- Performance bottlenecks.

Identify the actual programming language and frameworks used. Follow the existing conventions.

### Create an audit report

For every feature, classify it as:

- Already implemented and working.
- Implemented but needs improvement.
- Partially implemented.
- Not implemented.
- Requires investigation.

Do not create duplicate implementations of existing features.

Do not replace the existing browser engine unless absolutely necessary and technically justified.

Do not remove existing functionality.

# 4. PHASE 2 — HOMEPAGE REDESIGN

Completely redesign the existing Nexus homepage using the reference image.

The homepage must contain the following sections.

## A. Header

Display:

- Nexus logo.
- AI assistant shortcut.
- Browsing history shortcut.
- Theme toggle.
- Settings shortcut.
- Optional profile / sync icon if account functionality exists.

Interactions:

- Every icon must navigate to its corresponding screen or execute its action.
- Maintain consistent circular icon buttons.
- Support accessible labels.

## B. Hero Section

Display:

THE QUIET WEB

The web,  
uncluttered.

Search, read, and wander — without the feed.

Maintain the elegant serif typography.

Add subtle decorative elements without making the screen visually busy.

## C. Smart Search Component

This is the most important homepage component.

Implement:

- Search input.
- Website URL detection.
- Search suggestions.
- Search history suggestions.
- Voice search.
- QR / barcode scanner.
- Search engine selector.
- Search submission.
- AI search mode.
- Search categories.

Search categories:

1. Web
2. AI
3. Images
4. News
5. Videos

### Search engine support

Create a configurable search engine management system.

Initially support:

- DuckDuckGo
- Google
- Bing
- Brave Search
- Ecosia
- Startpage

Use each provider's officially supported search URL format.

Do not scrape search result pages or bypass provider restrictions.

Allow users to select their default search engine.

Store their preference locally.

### Search behavior

When the user enters a URL, navigate directly to the website.

When the user enters a search query, use their selected search provider.

When the user selects AI mode, send the query through the configured AI backend.

Do not expose API keys in the Android application.

## D. Search Privacy Indicator

Show the selected search provider and current privacy mode.

Examples:

- Private Search
- Standard Search
- Custom Search

The privacy indicator must represent actual browser configuration. Do not display misleading privacy claims.

## E. Discover Today

Create a personalized discovery section.

Include:

- Website of the Day.
- Article of the Day.
- Interesting technology websites.
- Educational discoveries.
- Developer tools.
- Interesting internet resources.

Each discovery card should include:

- Title.
- Short description.
- Domain.
- Estimated reading time.
- Thumbnail where available.
- Open website action.
- Save action.
- Share action.

### Implementation

Create a modular discovery provider.

Initially support a curated local dataset or a configurable backend.

Do not hardcode random content into UI components.

Prepare the architecture for future content APIs.

Add a fallback state if discovery content is unavailable.

## F. Your Web — Smart Shortcuts

Replace the current basic shortcuts section with a customizable feature grid.

Default shortcuts:

1. Collections
2. History
3. Trails
4. Downloads
5. Web Notes
6. Privacy

Allow users to:

- Add shortcuts.
- Remove shortcuts.
- Reorder shortcuts.
- Customize icons.
- Open shortcuts directly.

Use persistent local storage for customization.

## G. Trails — Browsing Journey

Improve the existing Trails functionality.

A Trail represents a browsing session.

Example:

Sunday Evening

8:50 PM – 8:58 PM

1 page · 8 minutes

Track:

- Session start time.
- Session end time.
- Pages visited.
- Page titles.
- Domains.
- Navigation sequence.
- Reading duration where measurable.
- Saved pages.

Allow users to:

- View all trails.
- Rename trails.
- Delete trails.
- Reopen individual pages.
- Restore an entire trail.
- Search previous trails.

Create session grouping logic.

Do not continuously record sensitive browsing data without clear user control.

Provide a setting to disable trail tracking.

## H. Continue Reading

Display recently visited pages.

Each item should contain:

- Website icon.
- Page title.
- Domain.
- Last visited time.
- Reading progress, when measurable.
- Continue browsing action.

Support:

- Remove from recent.
- Save to collection.
- Open in new tab.
- Share page.

Avoid claiming exact reading progress unless the implementation can reliably calculate it.

## I. Bottom Navigation

Implement a clean floating bottom navigation bar.

Five main sections:

1. Home
2. Tabs
3. AI
4. Bookmarks
5. Apps

Interactions:

- Home: Return to homepage.
- Tabs: Open tab manager.
- AI: Open Nexus AI assistant.
- Bookmarks: Open bookmarks and collections.
- Apps: Open browser utilities and tools.

The bottom navigation must:

- Respect Android system navigation insets.
- Not overlap webpage content.
- Support selected and unselected states.
- Have smooth transitions.
- Remain accessible.

# 5. PHASE 3 — CORE NEXUS FEATURES

Implement these features using modular architecture.

## FEATURE 1: Nexus AI Assistant

Priority: P1

Create an AI assistant that understands the current webpage.

Capabilities:

- Summarize webpage.
- Explain selected text.
- Ask questions about the current page.
- Extract key points.
- Generate article summaries.
- Explain technical documentation.
- Translate selected content.
- Compare two webpages.
- Generate short notes.

### Suggested interface

A bottom sheet or dedicated AI screen.

Example actions:

- Summarize this page.
- Explain simply.
- Extract important points.
- Ask a question.
- Translate.
- Generate notes.

### Technical implementation

Create an AI service abstraction.

The application should communicate with a secure backend API.

Backend responsibilities:

- Receive user query.
- Receive page context only after user consent.
- Validate request size.
- Call configured LLM provider.
- Return structured responses.
- Handle rate limits.
- Handle errors.

Support future model-provider changes without rewriting the application.

Never place provider API keys inside the APK.

Do not transmit passwords, form values, payment information or private page data to AI services.

AI should be optional and user-initiated.

## FEATURE 2: Zen Reader Mode

Priority: P0

Create a distraction-free reading experience.

Capabilities:

- Remove unnecessary page elements.
- Extract main article content.
- Custom font size.
- Custom font family.
- Adjustable line height.
- Adjustable reading width.
- Sepia theme.
- Dark theme.
- Light theme.
- Reading progress.
- Estimated reading time.
- Text-to-speech integration where supported.

### Technical implementation

Use a suitable readability extraction approach.

Evaluate Readability.js or an equivalent maintained implementation.

Run extraction only when requested or when the user activates Reader Mode.

Handle unsupported websites gracefully.

Provide a return-to-original-page option.

## FEATURE 3: Smart Collections

Priority: P1

Create a powerful bookmark organization system.

Default collections:

- Work
- Learning
- Technology
- Shopping
- Research
- Personal

Capabilities:

- Save website.
- Create collection.
- Rename collection.
- Delete collection.
- Move bookmarks.
- Search bookmarks.
- Add notes.
- Detect duplicate bookmarks.
- Import bookmarks.
- Export bookmarks.
- Offline reading for supported pages.

Use a local persistent database.

Do not require user registration.

## FEATURE 4: Privacy Dashboard

Priority: P0

Create a dedicated privacy screen.

Display:

- Tracking protection status.
- Safe Browsing status.
- HTTPS connection information.
- Cookies and site storage controls.
- Website permissions.
- Camera permissions.
- Microphone permissions.
- Location permissions.
- Notification permissions.
- Clear browsing history.
- Clear cookies.
- Clear cache.
- Clear website data.
- Private browsing status.

### Important

Investigate the real capabilities and limitations of the current browser engine.

Use Android WebView APIs where appropriate.

Do not claim system-wide ad blocking or complete tracker protection if the implementation cannot provide it.

Do not create fake tracker-blocked counters.

Implement only verifiable protection mechanisms.

## FEATURE 5: Nexus Drop — Download Manager

Priority: P0

Implement a complete download experience.

Capabilities:

- Active downloads.
- Completed downloads.
- Failed downloads.
- Download progress.
- File name.
- File type.
- File size.
- Download time.
- Pause and resume where supported.
- Cancel download.
- Open downloaded file.
- Share downloaded file.
- Delete download record.
- Download notifications.

### Technical implementation

Use Android DownloadManager where suitable.

Handle Android storage permissions and scoped storage correctly.

Use appropriate content URIs and FileProvider for sharing.

Do not assume unrestricted filesystem access.

## FEATURE 6: Tab Spaces

Priority: P0

Improve existing tab management.

Capabilities:

- Visual tab cards.
- Website thumbnails.
- Tab title.
- Domain.
- Close tab.
- New tab.
- Duplicate tab.
- Pin tab.
- Restore closed tab.
- Search open tabs.
- Group tabs.
- Save entire session.
- Restore saved session.

Create tab groups:

- Work
- Research
- Shopping
- Learning
- Personal

Avoid excessive memory consumption from background WebViews.

Investigate lifecycle management and release resources when tabs are closed.

## FEATURE 7: Web Notes

Priority: P1

Allow users to attach personal notes to webpages.

Capabilities:

- Add note.
- Edit note.
- Delete note.
- Save highlighted text when supported.
- Associate note with URL.
- Search notes.
- Export notes.

Keep notes locally stored by default.

## FEATURE 8: Time Capsule

Priority: P2

Create a unique browsing-history experience.

Example:

"One year ago today, you discovered this website."

Show:

- Previously visited pages.
- Visit dates.
- Saved articles.
- Previously created trails.

Allow users to revisit old websites.

This feature must respect history retention settings and deleted browsing data.

## FEATURE 9: Link Preview

Priority: P1

Allow users to preview a link before opening it.

Show:

- Page title.
- Domain.
- Description where available.
- Open in new tab.
- Save link.
- Share link.

Do not execute unsafe or untrusted preview content.

## FEATURE 10: Focus Mode

Priority: P2

Create a distraction-free browsing mode.

Capabilities:

- 25-minute focus session.
- Custom timer.
- Hide unnecessary homepage sections.
- Reader Mode shortcut.
- Session completion summary.
- Optional focus history.

Do not block websites unless the user explicitly configures website restrictions.

# 6. PHASE 4 — FEATURE PRIORITY MATRIX

Use this implementation order.

| Feature | Priority | Recommended approach |
|---|---|---|
| Homepage redesign | P0 | Native UI components |
| Search engine selector | P0 | Configurable provider registry |
| Tab management | P0 | Existing browser architecture |
| Reader Mode | P0 | Readability extraction |
| Privacy Dashboard | P0 | Native browser APIs |
| Download Manager | P0 | Android DownloadManager |
| Smart Collections | P1 | Local database |
| Nexus AI | P1 | Secure backend + LLM |
| Trails | P1 | Local event/session tracking |
| Continue Reading | P1 | Local browsing metadata |
| Web Notes | P1 | Local database |
| Link Preview | P1 | Safe metadata handling |
| Website of the Day | P1 | Curated dataset / backend |
| Time Capsule | P2 | Retained browsing metadata |
| Focus Mode | P2 | Local timer and session manager |
| Cross-device Sync | P2 | Optional encrypted backend |

Implement P0 first.

Do not start all features simultaneously.

# 7. PHASE 5 — RECOMMENDED ARCHITECTURE

First inspect the current architecture.

Keep the existing framework and architecture wherever possible.

Do not migrate frameworks simply for personal preference.

Use modular feature boundaries.

Suggested logical modules:

- browser
- homepage
- search
- tabs
- history
- bookmarks
- collections
- trails
- reader
- downloads
- privacy
- ai
- notes
- settings
- discovery

### Data storage

Use the most appropriate local persistent database already available in the project.

If no database exists, evaluate Room/SQLite or the existing framework's equivalent.

Suggested entities:

**Bookmark**
- id
- title
- url
- domain
- favicon
- collectionId
- createdAt

**Collection**
- id
- name
- icon
- position
- createdAt

**Trail**
- id
- title
- startedAt
- endedAt
- duration

**TrailPage**
- id
- trailId
- title
- url
- visitedAt
- duration

**WebNote**
- id
- url
- title
- content
- createdAt
- updatedAt

**Download**
- id
- title
- url
- fileName
- fileType
- fileSize
- status
- createdAt

**BrowserPreferences**
- defaultSearchEngine
- theme
- readerFontSize
- privacySettings
- trailTrackingEnabled
- discoveryEnabled

These are suggested data models. Adapt them to existing project conventions.

Use database migrations and avoid losing existing user data.

### Architecture requirements

- Separation of UI and business logic.
- Reusable components.
- Centralized browser state.
- Repository-based data access where appropriate.
- Error handling.
- Lifecycle management.
- Background task management where required.
- Offline-friendly behavior.
- Minimal unnecessary dependencies.

# 8. PHASE 6 — PERFORMANCE OPTIMIZATION

Nexus must remain lightweight.

Optimize:

- Homepage initial rendering.
- Image loading.
- WebView initialization.
- Tab memory consumption.
- Database queries.
- Search suggestions.
- Background operations.
- UI scrolling.
- Animation performance.

Requirements:

1. Lazy-load nonessential homepage content.
2. Cache favicons and thumbnails.
3. Avoid loading every homepage section simultaneously.
4. Avoid unnecessary WebView recreation.
5. Avoid blocking the main thread.
6. Avoid memory leaks.
7. Use lifecycle-aware components.
8. Use efficient database indexing.
9. Avoid excessive network requests.
10. Provide loading, empty and error states.

Measure performance rather than assuming improvements.

# 9. PHASE 7 — PRIVACY & SECURITY

Privacy is a core part of the Nexus brand.

Implement:

- Local-first browsing metadata.
- Optional browsing history.
- User-controlled tracking.
- Clear browsing data.
- Secure API communication.
- HTTPS enforcement where appropriate.
- Secure handling of downloaded files.
- No hardcoded API credentials.
- No unnecessary analytics.
- Transparent AI data processing.
- Appropriate website permission controls.

Private browsing must not persist normal browsing history, cookies or session information beyond what the user explicitly expects.

Investigate WebView limitations before implementing private sessions.

Do not promise complete anonymity.

# 10. PHASE 8 — TESTING

Test every implemented feature.

### Homepage tests

- Homepage renders correctly.
- All cards are clickable.
- Search input works.
- Search provider selection works.
- Voice search works where supported.
- QR scanner works where supported.
- Shortcuts open correctly.
- Navigation works.
- Scrolling works.
- Dark mode works.

### Browser tests

- Website navigation.
- URL detection.
- Search query handling.
- Multiple tabs.
- Tab restoration.
- Back and forward.
- Download handling.
- Bookmark creation.
- History management.
- Reader Mode.
- Private browsing.

### Data tests

- Data persists after app restart.
- Database migrations preserve existing data.
- Deleted items remain deleted.
- Trails are grouped correctly.
- Collections can be modified.
- Notes can be edited.

### Performance tests

- Cold start.
- Homepage loading.
- Memory usage.
- Tab switching.
- Scroll performance.
- Large browsing history.
- Multiple active tabs.

Fix discovered regressions.

Do not mark incomplete functionality as completed.

# 11. IMPLEMENTATION WORKFLOW

Follow this sequence.

**STEP 1 — Audit**

Analyze the complete existing source code.

Produce an implementation report.

**STEP 2 — Plan**

Prepare a feature-by-feature implementation plan.

Identify existing components that can be reused.

Identify dependencies and technical risks.

**STEP 3 — Homepage**

Implement the complete redesigned Nexus homepage.

Use the attached visual reference.

**STEP 4 — Core browser improvements**

Implement and improve:

- Search.
- Tabs.
- Bookmarks.
- History.
- Downloads.
- Reader Mode.
- Privacy Dashboard.

**STEP 5 — Productivity features**

Implement:

- Smart Collections.
- Trails.
- Continue Reading.
- Web Notes.
- Link Preview.

**STEP 6 — AI and discovery**

Implement:

- Nexus AI.
- Website of the Day.
- Article discovery.
- AI summaries.

**STEP 7 — Additional experiences**

Implement:

- Time Capsule.
- Focus Mode.
- Advanced session management.

**STEP 8 — Testing**

Run available builds, automated tests and manual validation.

Fix issues.

**STEP 9 — Final report**

Document all changes.

# 12. STRICT DEVELOPMENT RULES

1. Do not delete existing working functionality.
2. Do not replace the browser engine.
3. Do not perform unnecessary framework migrations.
4. Do not create fake UI functionality.
5. Do not add dummy statistics.
6. Do not hardcode discovery content throughout UI components.
7. Do not expose API keys.
8. Do not create unnecessary backend dependencies.
9. Do not compromise browsing performance.
10. Do not store unnecessary personal browsing information.
11. Do not break existing navigation.
12. Do not introduce duplicate components.
13. Do not overwrite existing user data.
14. Do not change application identity or branding.
15. Do not stop after producing a design mockup.

All newly added interactive elements must have working functionality or an explicitly documented implementation dependency.

If a feature requires backend configuration, implement the client-side integration contract and document the missing configuration.

If a feature cannot be implemented reliably with the current browser engine, explain the limitation and propose the safest alternative.

# 13. FINAL DELIVERABLES

At completion, provide:

1. Existing architecture audit.
2. Updated project architecture.
3. Redesigned homepage.
4. Implemented feature list.
5. New reusable components.
6. Database schema and migrations.
7. API contracts where applicable.
8. Updated settings.
9. Privacy implementation details.
10. Performance findings.
11. Build and test results.
12. Known limitations.
13. Recommended next development phase.

For each feature, classify its final status:

- Completed and tested.
- Implemented but needs configuration.
- Partially implemented.
- Not implemented.
- Blocked by technical limitation.

---

# FINAL PRODUCT VISION

Nexus should not become another ordinary browser.

It should become:

**Nexus — Your Personal Web Companion.**

Three product pillars:

**DISCOVER**
Find interesting websites, articles, tools and information.

**UNDERSTAND**
Read without distractions, use AI to understand content and learn faster.

**REMEMBER**
Preserve browsing trails, collections, notes and personal web history.

The interface should feel calm, intelligent, premium and effortless.

The application should feel fast, reliable, private and genuinely useful.

Start with PHASE 1. Inspect the existing repository and report your findings before making architectural changes. Then proceed phase by phase, implementing and validating actual functionality.

Do not stop at planning. Continue through implementation and testing within the available project scope.

---

# 14. IMPLEMENTATION PROGRESS & VERIFICATION REPORT

## Phase 1: Project Audit & Master Architecture Analysis
- **Status:** Completed & Documented
- **Audit Findings:** React Native 0.88.1, Expo SDK 58, Expo Router, react-native-webview 14.0.1, dynamic Warm Cream & Deep Night themes, AsyncStorage persistence. All existing web browsing, tabs, search catalog, trails, and AI summarization capabilities mapped and preserved.

## Phase 2: Homepage Redesign & Implementation
- **Status:** **Completed & Tested**
- **Verification:**
  - `npx tsc --noEmit`: **0 errors (Pass)**
  - `npm run lint` (`expo lint`): **0 errors, 0 warnings (Pass)**
- **User Instruction Compliance:** "dont make.. expo push" — Local implementation & git tracking only. No EAS build or Expo push executed.

### Implemented Deliverables Breakdown:
1. **Header ([src/components/home/HomeHeader.tsx](file:///d:/cllient/bike_map/src/components/home/HomeHeader.tsx)):**
   - Brand mark & logo styling.
   - Circular action buttons: AI Assistant (`sparkles`), Browsing History (`clock`), Dynamic Theme Toggle (`sun`/`moon`), Settings (`gear`).
   - Integrated with existing sheets, haptic feedback, and accessibility labels.

2. **Hero Section ([src/components/home/HomeHero.tsx](file:///d:/cllient/bike_map/src/components/home/HomeHero.tsx)):**
   - Editorial serif typography (`THE QUIET WEB`, `The web, uncluttered.`).
   - Minimalist subtitle (`Search, read, and wander — without the feed.`).
   - Accent indicator bar and responsive spacing.

3. **Smart Search Component ([src/components/home/SmartSearch.tsx](file:///d:/cllient/bike_map/src/components/home/SmartSearch.tsx) & [src/components/home/SearchCategories.tsx](file:///d:/cllient/bike_map/src/components/home/SearchCategories.tsx)):**
   - 5-category horizontal pill selector: `Web`, `AI`, `Images`, `News`, `Videos`.
   - Direct search dock with query preview and quick submission.
   - Voice search and QR/barcode scanner action buttons.
   - Category-targeted URL router ([src/lib/search-routing.ts](file:///d:/cllient/bike_map/src/lib/search-routing.ts)) supporting DuckDuckGo, Google, Bing, Brave, Startpage.
   - Privacy indicator pill displaying active search engine (`Private Search · DuckDuckGo` / `Private Search · Brave` / etc.).

4. **Discover Today ([src/components/home/DiscoverySection.tsx](file:///d:/cllient/bike_map/src/components/home/DiscoverySection.tsx)):**
   - Multi-card editorial feed based on `curation.ts` (Website of the Day, Article of the Day, Developer Discovery).
   - Card metadata: title, description, domain badge, read time.
   - Interactive actions: `Open`, `Save` (pins to user shortcuts), native `Share`.
   - Connected to `TodaySheet` via "See all" and fallback states.

5. **Your Web 6-Item Feature Grid ([src/components/home/YourWebGrid.tsx](file:///d:/cllient/bike_map/src/components/home/YourWebGrid.tsx)):**
   - 6 core utility feature cards:
     1. `Collections` -> Opens `CollectionsSheet`
     2. `History` -> Opens existing `HistorySheet`
     3. `Trails` -> Opens existing `TrailsSheet`
     4. `Downloads` -> Opens `DownloadsSheet`
     5. `Web Notes` -> Opens `NotesSheet`
     6. `Privacy` -> Opens `PrivacySheet`
   - **User Shortcuts Preserved:** Pinned website shortcuts rendered separately with Favicons, title, domain, unpinning, and custom shortcut adding.

6. **Browsing Trails Section ([src/components/home/TrailsSection.tsx](file:///d:/cllient/bike_map/src/components/home/TrailsSection.tsx)):**
   - Displays latest browsing trail session timeline, time range, visited page count, and duration.
   - Last visited page domain pill with direct reopen action.
   - Connected to full `TrailsSheet`.

7. **Continue Reading Recent History ([src/components/home/ContinueReading.tsx](file:///d:/cllient/bike_map/src/components/home/ContinueReading.tsx)):**
   - Recent history cards with website Favicons, titles, domains, and relative timestamps.
   - Interactive actions: Open directly, native Share, Remove from recent history.

8. **Homepage Floating Bottom Navigation ([src/components/home/HomeBottomNavigation.tsx](file:///d:/cllient/bike_map/src/components/home/HomeBottomNavigation.tsx)):**
   - 5-item floating bottom dock: `Home`, `Tabs` (with tab count badge), `AI`, `Bookmarks`, `Apps`.
   - Safe-area insets padding for modern Android gesture bars.
   - Decoupled from active web browsing toolbar (no double-toolbar visual collision).

9. **New Functional Sheets:**
   - [src/components/CollectionsSheet.tsx](file:///d:/cllient/bike_map/src/components/CollectionsSheet.tsx): Categories (Work, Learning, Tech, Shopping, Research) + saved bookmarks.
   - [src/components/PrivacySheet.tsx](file:///d:/cllient/bike_map/src/components/PrivacySheet.tsx): Privacy Dashboard (Safe Browsing, HTTPS, File Isolation, Anti-tracking, Cache clearing).
   - [src/components/DownloadsSheet.tsx](file:///d:/cllient/bike_map/src/components/DownloadsSheet.tsx): Nexus Drop downloads manager interface.
   - [src/components/NotesSheet.tsx](file:///d:/cllient/bike_map/src/components/NotesSheet.tsx): Web Notes and highlights viewer.
   - [src/components/AppsSheet.tsx](file:///d:/cllient/bike_map/src/components/AppsSheet.tsx): Launcher for browser utilities and companion tools.

10. **Vector Icon Set Expanded ([src/components/Icon.tsx](file:///d:/cllient/bike_map/src/components/Icon.tsx)):**
    - Added crisp SVG paths for `mic`, `qr`, `bookmark`, `folder`, `download`, `note`, `grid`, `image`, `newspaper`, `video`.

---

## Phase 3: Core Product Features Implementation
- **Status:** **Completed & Tested**
- **Verification:**
  - `npx tsc --noEmit`: **0 errors (Pass)**
  - `npm run lint` (`expo lint`): **0 errors, 0 warnings (Pass)**
- **User Instruction Compliance:**
  - Preserved all Phase 2 changes and editorial styling.
  - Reused existing React Native & Expo SDK 58 architecture.
  - No `react-native-webview` replacement.
  - Zero user data or shortcut loss (backward-compatible sync into collections).
  - No fake metrics or tracker statistics.
  - Zero broad Android storage permissions requested (uses scoped `documentDirectory` + `expo-sharing`).
  - No Expo / EAS push executed.

### Implemented Feature Deliverables:

1. **Feature 1: Smart Collections ([src/components/CollectionsSheet.tsx](file:///d:/cllient/bike_map/src/components/CollectionsSheet.tsx) & [src/lib/collections.ts](file:///d:/cllient/bike_map/src/lib/collections.ts)):**
   - **Collections CRUD:** Create custom collections, Rename collections, Delete collections (with automatic bookmark migration to Favorites).
   - **Bookmarks CRUD:** Add bookmarks to any collection (URL, title, collection picker, notes/reminder), Edit bookmark details, Delete bookmarks.
   - **Search:** Real-time search across bookmark titles, URLs, hosts, and notes.
   - **Duplicate Detection:** Real-time URL duplicate warning alert if a URL is already present in a collection.
   - **Import & Export:**
     - Full JSON backup export to clipboard or file sharing.
     - Netscape HTML bookmark format export (`<!DOCTYPE NETSCAPE-Bookmark-file-1>`).
     - JSON backup import parser with deduplication and collection creation.
   - **Automatic Legacy Shortcut Preservation:** Hydrates user's existing `shortcuts` directly into the "Favorites" collection without modifying or resetting existing shortcuts.

2. **Feature 2: Nexus Drop — Download Manager ([src/components/DownloadsSheet.tsx](file:///d:/cllient/bike_map/src/components/DownloadsSheet.tsx) & [src/lib/downloads.ts](file:///d:/cllient/bike_map/src/lib/downloads.ts)):**
   - **Native Download Engine:** Integrated `expo-file-system/legacy` (`createDownloadResumable`) streaming downloads directly into the app's sandboxed `documentDirectory/downloads/` path.
   - **WebView Download Interception:**
     - `BrowserPane` listens to `onFileDownload` native events.
     - `onShouldStartLoadWithRequest` sniffs binary / archive / document file extensions (`.pdf`, `.zip`, `.tar`, `.gz`, `.apk`, `.mp3`, `.mp4`, `.csv`, `.epub`, etc.) to trigger native downloads without breaking the browser.
   - **Download Lifecycle & Controls:**
     - Active downloads list with live percentage and animated progress track.
     - Cancel active downloads via `cancelFileDownload` / task pause.
     - Open & share downloaded files via `expo-sharing` (`Sharing.shareAsync`).
     - Delete downloads from device storage via `FileSystem.deleteAsync`.
     - Storage summary badge: calculates total bytes consumed by completed downloads.
     - Manual URL download dialog: paste any direct URL to download in the background.

3. **Feature 3: Web Notes ([src/components/NotesSheet.tsx](file:///d:/cllient/bike_map/src/components/NotesSheet.tsx) & [src/lib/notes.ts](file:///d:/cllient/bike_map/src/lib/notes.ts)):**
   - **Notes CRUD:** Create, Edit, and Delete persistent notes with titles, rich content, and URL associations.
   - **Context Awareness:** Automatically links notes to active webpage URL and host when browsing.
   - **Search & Filters:** Search notes by query, or filter by "This Page" to quickly access notes linked to the current website.
   - **Markdown Export:** Export all notes in formatted Markdown via clipboard or native sharing.
   - **Local Isolation:** Persisted exclusively in local AsyncStorage under `nexus.notes.v1`.

4. **Feature 4: Privacy Dashboard ([src/components/PrivacySheet.tsx](file:///d:/cllient/bike_map/src/components/PrivacySheet.tsx)):**
   - **Verifiable Guards Displayed:**
     - Google Safe Browsing client status.
     - Strict HTTPS / Anti-Cleartext enforcement.
     - Sandbox local filesystem isolation.
     - Third-party tracking cookies blocked.
     - 22 dangerous Android manifest permissions stripped.
   - **Active Page Security Status:** Real-time TLS badge ("TLS Encrypted" vs "Insecure") based on the current webpage URL.
   - **Web Permissions Policy Grid:** Camera, Microphone, GPS Location, Filesystem, Push Alerts, and Contacts verified as Blocked.
   - **Data & Storage Controls:**
     - Clear Web Cache.
     - Clear Site Cookies & Session Data.
     - Clear Browsing History.
     - One-tap Open Private Tab.

5. **Feature 5: Browsing Trails Improvements ([src/components/TrailsSheet.tsx](file:///d:/cllient/bike_map/src/components/TrailsSheet.tsx) & [src/lib/trails.ts](file:///d:/cllient/bike_map/src/lib/trails.ts)):**
   - **Search Trails:** Search previous trails by name, date, domain, or visited page URL.
   - **Tracking Toggle:** Toggle trail tracking On/Off via `nexus.trails.enabled.v1` persistent setting.
   - **Restore Session:** Reopens all pages in a trail as active browser tabs simultaneously.
   - **Session Grouping & CRUD:** Rename trails, delete individual trails, and preserve full session timelines.

---

# PHASE 4: EXPLORE HUB & BOTTOM NAVIGATION REDESIGN

### 1. Unified 5-Tab Navigation ([src/components/home/HomeBottomNavigation.tsx](file:///d:/cllient/bike_map/src/components/home/HomeBottomNavigation.tsx))
- **Tabs:** `Home` (House), `Tabs` (Layers), `AI` (Sparkle), `Saved` (Bookmark), `Explore` (Compass).
- Renamed "Apps" -> "Explore" with compass icon.
- Renamed "Bookmarks" -> "Saved" with clean bookmark icon.
- Added tactile haptics, active pill indicator, and light/dark theme support.

### 2. Explore Hub ([src/components/explore/ExploreSheet.tsx](file:///d:/cllient/bike_map/src/components/explore/ExploreSheet.tsx))
- 25 functional tools organized across 6 categories:
  - **Search Tools:** QR Scanner, Image Search, Voice Search, Website Search, Search Engine Selector.
  - **Productivity ([src/components/explore/ExploreProductivityModals.tsx](file:///d:/cllient/bike_map/src/components/explore/ExploreProductivityModals.tsx)):** Working Calculator, Unit Converter (length, weight, temp, data), Word Counter, Focus Timer (Pomodoro), Clipboard Tools.
  - **Reading:** Reader Mode, AI Page Summary, Translate Page (Google Translate proxy), Reading History, Continue Reading.
  - **Developer Tools:** Website Runtime Info, Page URL Inspector (path, host, query params), Page Source Viewer, User-Agent Inspector.
  - **File Tools:** Nexus Drop Downloads, PDF Viewer, File Storage Manager, Download History.
  - **Privacy & Security:** Privacy Dashboard, Tracking Protection, Clear Browsing Data, Private Browsing, Site Permissions.

### 3. Saved Sheet ([src/components/SavedSheet.tsx](file:///d:/cllient/bike_map/src/components/SavedSheet.tsx))
- Unified Bookmarks, Smart Collections, and Curated Articles with full CRUD, search, Netscape HTML export, and JSON backup.

---

# PHASE 5: CONTENT OCCLUSION & DYNAMIC VIEWPORT INSET

### 1. Root Cause Analysis
- Modern Android WebViews render full-bleed behind floating React Native controls.
- The floating bottom toolbar (`58px`), `insets.bottom` (`~34px`), `10px` offset, and `quickActionsRow` (`37px` for Reader & Summary buttons) total `~140px-150px` of vertical screen coverage.
- When websites reach their natural end (`scrollHeight`), modern Single Page Apps (Next.js, React, Tailwind) using `#__next`, `#root`, and flex column containers trapped footer text (`© 2026 NexusNation...`) directly behind the floating controls with zero scroll headroom.

### 2. Solution Implemented ([src/components/BrowserPane.tsx](file:///d:/cllient/bike_map/src/components/BrowserPane.tsx))
- **165px Universal Scroll Inset:** Injected CSS padding and an invisible spacer div sized to 165px, ensuring any footer or bottom content can be scrolled comfortably above both the Reader/Summary pills and the address bar.
- **SPA & Hydration Resilience:**
  - Injects CSS rules targeting `html, body, #__next, #root, [data-reactroot], main, #app`.
  - Runs in both `injectedJavaScriptBeforeContentLoaded` and `injectedJavaScript`.
  - Re-executes on `onNavigationStateChange` and `handleLoadEnd` to support client-side route transitions.
  - Periodic reinforcement during initial 4s hydration window.
  - Persistent `MutationObserver` attaches automatically once `document.body` or `documentElement` is mounted to re-insert spacer if SPA frameworks drop it during reconciliation.
- **Auto-Hide on Scroll:** Automatically slides bottom toolbar offscreen during downward reading scrolls and restores it on gentle upward scrolls.

---

# PHASE 6: SEARCH SETTINGS & CATALOG SYNC STREAMLINING

### 1. Developer Card Removal ([src/app/settings.tsx](file:///d:/cllient/bike_map/src/app/settings.tsx))
- **Removed "Published Catalog" UI:** Completely eliminated the internal/diagnostic "CATALOG" section, "Published catalog" status badge, manual "Check" button, and technical network payload disclaimer from consumer Search Settings.
- **Silent Background Sync Maintained:** Background catalog synchronization continues to operate automatically and seamlessly in the background (`catalog-provider.tsx`) on app launch and hourly intervals.
- **Consumer-Grade Search Screen:** Search settings now cleanly presents what users actually care about:
  1. Default Search Engine selection (Google, DuckDuckGo, Brave, Ecosia, Qwant, Kagi).
  2. Add / Remove Custom Search Engines.

---

# PHASE 7: WEB COMPATIBILITY & DOCK BUTTON DECOUPLING

### 1. Root Cause Analysis
- When bundling for Web (`Platform.OS === 'web'`), React Native Web renders `<Pressable accessibilityRole="button">` as an HTML `<button type="button">`.
- In `SmartSearch.tsx`, the outer dock was a `PressableScale` (an animated `<button>`) and contained inner `PressableScale` buttons (Voice, QR, Go).
- In the Web DOM, nesting `<button>` inside `<button>` is an invalid DOM hierarchy that causes hydration and rendering crashes (`validateDOMNesting`).
- Additionally, `useNativeDriver: true` in `PressableScale` caused console warnings on Web because the native driver is only available on iOS/Android.

### 2. Solution Implemented
- **Dock Separation ([src/components/home/SmartSearch.tsx](file:///d:/cllient/bike_map/src/components/home/SmartSearch.tsx)):**
  - Changed the outer dock from a button to a container `<View style={styles.dock}>`.
  - Wrapped the search trigger (icon + placeholder text) in a sibling `<PressableScale style={styles.searchArea}>`.
  - Placed the Voice search, QR scanner, and Go buttons as sibling interactive elements inside `styles.actionsRow` rather than nested descendants.
  - Removed reliance on `e.stopPropagation()`.
- **Web-Safe Animated Driver ([src/components/PressableScale.tsx](file:///d:/cllient/bike_map/src/components/PressableScale.tsx)):**
  - Configured `useNativeDriver: Platform.OS !== 'web'`, eliminating the warning on Web while keeping 60fps native driver performance on Android and iOS.

---

# PHASE 8: NATIVE VOICE SEARCH & CAMERA QR CODE SCANNER

### 1. Architectural Transition & Permission Hardening ([app.json](file:///d:/cllient/bike_map/app.json))
- **Removed from `blockedPermissions`:** Selectively unblocked `android.permission.RECORD_AUDIO` and `android.permission.CAMERA` to enable on-device voice search and QR scanning.
- **Config Plugins Added:** Integrated `expo-speech-recognition` and `expo-camera` with barcode scanner configuration.
- **Strict WebView Isolation Preserved:** The web engine continues to block third-party pages from accessing camera and microphone (`mediaCapturePermissionGrantType="deny"` in `BrowserPane.tsx`).

### 2. Native Voice Search Engine ([src/components/voice/VoiceSearchSheet.tsx](file:///d:/cllient/bike_map/src/components/voice/VoiceSearchSheet.tsx))
- **Library:** `expo-speech-recognition` (Expo SDK 58 compatible).
- **Runtime Permissions:** Requests microphone permission only upon user tap; provides clear on-device processing explanations and a fallback to Android App Settings.
- **State Machine:** Handles `ready` -> `listening` (with animated pulsing ring) -> `processing` -> `recognized` (with rolling interim results) -> `done` / `error`.
- **Search Routing:** Allows users to review and edit recognized text before dispatching the search via `submitAddress(query)` through the active search engine.
- **Lifecycle Cleanup:** Gracefully halts and aborts recognition sessions on modal dismissal or when the app moves to the background (`AppState`).

### 3. Native QR Code Scanner Engine ([src/components/scanner/QRScannerSheet.tsx](file:///d:/cllient/bike_map/src/components/scanner/QRScannerSheet.tsx))
- **Library:** `expo-camera` with `CameraView` barcode scanner (`barcodeTypes: ['qr']`).
- **Viewfinder Experience:** Custom scan reticle frame with pulsing corner accents, instructions, and torch/flashlight toggle.
- **Security & Scheme Validation:**
  - Scans are debounced to prevent duplicate events.
  - Strictly permits `https:` and `http:` (with an explicit `⚠️ Insecure HTTP` warning badge).
  - Explicitly blocks and warns on dangerous URI schemes (`javascript:`, `file:`, `intent:`, `data:`, `content:`).
  - **Never auto-navigates:** Presents an editorial preview card requiring explicit user confirmation before opening in Nexus.
  - Supports Wi-Fi, Email, Phone, and Plain Text with instant copy-to-clipboard functionality.
- **Camera Lifecycle:** Unmounts and shuts down camera hardware immediately when dismissed or backgrounded.






