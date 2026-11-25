# Play screenshots

Eight captures for the Google Play listing, in upload order.

| File | Screen |
| --- | --- |
| `01-home.png` | Home from the top: hero, omnibox, Today's page |
| `02-home-shelves.png` | Latest trail, shortcuts, and recent pages |
| `03-today.png` | Today archive sheet |
| `04-trails.png` | Trails sheet |
| `06-browser.png` | A real page in the browser |
| `07-tabs.png` | Four open tabs in the grid |
| `09-private.png` | Private-tab start page in the night palette, including the shared-cookie note |
| `08-discussions.png` | Hacker News discussion sheet in dark mode |

- 780 × 1520 px (390 × 760 at DPR 2), 1.95:1, within Play's 2:1 limit.
  `02-home-shelves.png` is cropped to 780 × 1480 so the frame ends on a clean
  edge instead of a half-visible footer line.
- 24-bit PNG, no alpha channel.
- Captured from the app's React Native interface through the web QA harness, so
  there is no Android status bar. Tabs show hostnames on web because a
  cross-origin iframe cannot report its title; a device build shows page titles.
- Sample browsing content is local demo data; no personal browsing data is included.
  The discussion sheet in `08-discussions.png` shows a real, public Hacker News
  thread for the article behind it.

`PLAY_STORE_PUBLISHING.md` has the listing order and the upload checklist. The
older `09-address.png` remains as reference artwork but is not part of the
eight-image upload set.
