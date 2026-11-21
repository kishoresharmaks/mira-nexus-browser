# Play listing artwork

| File | Size | Purpose |
| --- | --- | --- |
| `feature-graphic.png` | 1024 × 500 | Play Store feature graphic |
| `feature-graphic.html` | 1024 × 500 | Editable source for the graphic |

The feature graphic is a 24-bit PNG with no alpha channel, which Play requires.
It uses Instrument Serif and Instrument Sans from `admin/public/fonts`, so the
file renders correctly offline.

To regenerate it after a copy or layout change, open `feature-graphic.html` in a
browser sized to exactly 1024 × 500 and capture the viewport. With Chrome:

```powershell
$root = (Get-Location).Path.Replace('\', '/')
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --disable-gpu --hide-scrollbars `
  --force-device-scale-factor=1 --window-size=1024,500 `
  --virtual-time-budget=3000 --run-all-compositor-stages-before-draw `
  --screenshot="$root/docs/play/feature-graphic.png" `
  "file:///$root/docs/play/feature-graphic.html"
```

Confirm the result is 1024 × 500 with three channels and no alpha before
uploading. Do not add a tracking claim: the home-screen banner is served by
Google AdMob, which can access the advertising ID.

`screenshots/` holds the phone screenshots and their capture notes.
