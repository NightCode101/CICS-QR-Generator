# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CICS QR Code Generator** is a Progressive Web App (PWA) for generating student QR codes. It's a **vanilla JavaScript project** with no build system, framework, or npm dependencies. All code is served statically.

**Tech Stack:**
- Pure HTML5, CSS3, JavaScript (ES6+)
- Service Worker (PWA support)
- External libraries via CDN:
  - QRCode.js (QR generation): `https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js`
  - JSZip (bulk ZIP export): `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js`
  - Google Analytics (gtag.js)
- localStorage (client-side persistence)

**No build process needed.** Just open `.html` files in a browser or serve via a static host.

---

## File Structure & Purpose

```
CICS-QR-Generator/
├── index.html                  # Single QR generation page (main entry)
├── bulk.html                   # Bulk QR generation from CSV-like data
├── nfc.html                    # NFC tag reader/writer (password protected)
├── privacy.html                # Legal: Privacy Policy & Terms of Use
├── 404.html                    # Custom 404 error page
│
├── js/
│   └── script.js              # All JavaScript logic (page-specific + shared)
│
├── css/
│   └── style.css              # All CSS (single file, dark mode included)
│
├── service-worker.js           # PWA caching strategy (offline support)
├── manifest.json              # PWA config (app name, icons, display mode)
│
├── assets/                    # Images and template files
│   ├── template-background.png # QR code canvas background
│   ├── preview.png            # Type template preview
│   ├── icon-192.png           # PWA icon (phone)
│   ├── icon-512.png           # PWA icon (splash screen)
│   └── fonts/impact.ttf       # Custom font for QR text
│
├── MODERNIZATION_GUIDE.md     # How to implement Google AdSense + styling changes
├── UI_CHANGES_SUMMARY.md      # Visual/design change documentation
└── README.md                  # User-facing documentation
```

---

## Architecture & Key Patterns

### Single-File JavaScript Pattern
All logic is in `js/script.js` **organized by section**:

```javascript
// 1. SHARED FUNCTIONS & VARIABLES (used by all pages)
function showToast(message) { ... }
function getFontSize(name) { ... }
function acceptCookies() { ... }

// 2. PAGE-SPECIFIC LOGIC (runs based on body class)
document.addEventListener('DOMContentLoaded', () => {
  // Global state
  let dataToGenerate = null;

  // SHARED SETUP (all pages)
  // - Theme toggle
  // - Cookie consent
  // - Modal logic

  // PAGE-SPECIFIC SECTIONS
  if (document.body.classList.contains('page-single')) {
    // index.html logic: generateQR(), downloadQR(), etc.
  }

  if (document.body.classList.contains('page-bulk')) {
    // bulk.html logic: generateBulkQRs(), downloadSelectedZipped(), etc.
  }

  if (document.body.classList.contains('page-nfc')) {
    // nfc.html logic: writeNFC(), readNFC(), NFC security, etc.
  }
});
```

**Why this pattern?** Keeps all logic in one file while allowing per-page customization. Each page's `<body class="page-*">` determines which code runs.

### Modal-Driven UX Flow
User actions (generate, download) trigger confirmation modals:
1. User enters data → clicks button
2. Modal shows → "Are you sure?" + data preview
3. User confirms → actual action executes
4. Toast notification shows result

This pattern is applied to all major actions (generateQR, downloadQR, generateBulkQRs, etc.)

### localStorage Persistence
- **QR History:** Stores generated QR codes (image + name)
- **Theme Preference:** "light" or "dark"
- **Cookie Consent:** "accepted" or "dismissed"

### Canvas-Based QR Generation
1. User data formatted as `ID|NAME`
2. QRCode.js creates QR from data
3. Canvas draws template image + QR + name text
4. Canvas exported as PNG (via toDataURL or toBlob)

---

## Styling & Theme System

### CSS Architecture
Single file (`css/style.css`) organized as:
1. **CSS Variables** (`:root`) - Colors, shadows, radius, transitions
2. **Navbar & Navigation** - Modern solid gradient (updated 2026)
3. **Layout** - Grid/flex for responsive design
4. **Cards & Modals** - Form containers, history, popups
5. **Page-specific** - Styles for `.page-single`, `.page-bulk`, `.page-nfc`
6. **Dark Mode** - `body.dark-mode` selectors throughout
7. **Animations** - slideUp, slideDown, fadeIn, spin

### Color Scheme (DO NOT CHANGE - Google Ads requirement)
```css
:root {
  --primary-color: #e59e02;      /* Orange */
  --primary-hover: #fd7f09;       /* Darker orange */
  --bg-color: #f8f5f2;            /* Cream/off-white */
  --text-main: #2d3436;           /* Dark gray */
  --text-muted: #636e72;          /* Medium gray */
  --white: #ffffff;
  --card-bg: #ffffff;
  --input-bg: #f0f2f5;
}
```

### Dark Mode
Applied when `body.dark-mode` class is active. Every component has dark mode equivalent styles prefixed with `body.dark-mode .element { ... }`

### Recent Design Changes (April 2026)
- **Navbar:** Removed glassmorphism blur, now uses solid gradient
- **Navigation Links:** Changed from pills (50px radius) to rounded squares (8px)
- **Ad Section:** Simplified from animated card to static placeholder (Google Ads compliant)
- See `UI_CHANGES_SUMMARY.md` for before/after details

---

## JavaScript Key Functions

### Shared (All Pages)
| Function | Purpose |
|----------|---------|
| `showToast(message)` | Show temporary notification (2.5s auto-dismiss) |
| `getFontSize(name)` | Calculate font size to fit name on QR |
| `acceptCookies()` | Save consent choice to localStorage |
| `dismissCookies()` | Save dismiss choice to localStorage |
| `applyTheme(theme)` | Toggle light/dark mode |

### Single QR (index.html)
| Function | Purpose |
|----------|---------|
| `generateQR()` | Validate input, show confirmation modal, generate QR |
| `downloadQR()` | Export canvas as PNG file |
| `resetQR()` | Clear inputs, reset canvas |
| `addToHistory(dataURL, name)` | Store generated QR in localStorage |
| `clearHistory()` | Delete all saved history |

### Bulk QR (bulk.html)
| Function | Purpose |
|----------|---------|
| `generateBulkQRs()` | Parse `ID\|Name` format, generate all QRs |
| `downloadSelectedZipped()` | Export selected QRs as ZIP file |
| `toggleSelectAll(checkbox)` | Select/deselect all QR checkboxes |
| `clearSelection()` | Uncheck all selections |
| `resetBulkQR()` | Clear textarea and preview |

### NFC (nfc.html)
| Function | Purpose |
|----------|---------|
| `writeNFC()` | Write data to NFC tag (Web NFC API - Android only) |
| `readNFC()` | Read NFC tag data |
| `verifyPassword()` | Check admin password (hardcoded for security) |
| `handleExternalNFCReader()` | Handle USB RFID reader input |

---

## PWA & Service Worker

### How It Works
The `service-worker.js` implements **cache-first strategy**:
1. On install: Cache all static assets + external libraries
2. On fetch: Serve from cache if available, fallback to network
3. On activate: Clean up old cache versions

### Cache Version Management
```javascript
const CACHE_NAME = 'qr-cache-v4'; // Increment this to force update
```
Increment the version number when deploying changes to bust old caches.

### What's Cached
- HTML pages (all 5)
- CSS & JS files
- Local assets (images, fonts)
- External CDN libraries (QRCode.js, JSZip)

### Service Worker Updates
**When to update CACHE_NAME:**
- Modify CSS or JavaScript
- Add/remove HTML pages
- Update images or fonts

**How users get updates:**
1. Browser detects new service worker
2. Waits for old worker to release
3. On next visit or refresh: new assets loaded

---

## How to Develop

### Local Setup
```bash
# No build step needed! Just open files in browser

# Option 1: Live preview
open index.html

# Option 2: Run simple HTTP server
python -m http.server 8000      # Python
php -S localhost:8000           # PHP
npx http-server                 # Node.js (if installed)

# Then visit: http://localhost:8000
```

### Development Tips
- **Edit CSS:** Changes visible on refresh (no build needed)
- **Edit JavaScript:** Changes visible on refresh (no build needed)
- **Service Worker:** Won't always reload on dev changes. In DevTools: Unregister → refresh
- **Browser DevTools:**
  - Console: Check for JS errors
  - Storage → LocalStorage: See saved theme, history, cookies
  - Application → Manifest: Verify PWA config
  - Network: Check Service Worker caching

### Testing Pages
1. **index.html** - Single QR: Test ID/Name input, generate, download
2. **bulk.html** - Bulk QR: Test CSV parsing, selective download, ZIP export
3. **nfc.html** - NFC: Requires Android + Chrome + NFC device (or external reader)
4. **privacy.html** - Legal: Make sure links work
5. **404.html** - Try visiting non-existent page when hosted

### Common Edits

**Add new CSS:**
1. Find the appropriate section in `css/style.css`
2. Add your rule
3. Add dark mode equivalent (if needed): `body.dark-mode .your-class { ... }`
4. Refresh browser

**Add new function:**
1. If shared by all pages: Add to top of `js/script.js` (before DOMContentLoaded)
2. If page-specific: Add inside the appropriate `if (document.body.classList.contains('page-*'))` block
3. Export to window if it should be callable from HTML: `window.myFunction = function() { ... }`

**Fix modal styling:**
- `.modal-overlay` - Background fade
- `.modal-content` - Modal card
- `.alert-content` - Alert variant
- `.confirm-content` - Confirmation variant

---

## Google Ads Integration

### Current Status (April 2026)
- ❌ Removed: All problematic ad networks (Adsterra, EffectiveGate, etc.)
- ✅ Ready: Placeholders for Google AdSense implementation
- 📋 Requirement: All ads use `.ad-placeholder` class

### To Add Google Ads
1. Get approved for Google AdSense
2. Replace `.ad-placeholder` in `index.html`, `bulk.html`, `privacy.html` with AdSense script
3. Update `service-worker.js` to cache the AdSense library
4. See `MODERNIZATION_GUIDE.md` for detailed setup

### Ad Placement Rules
- ✅ Maximum 3 ad units per page
- ✅ Use responsive ad format
- ✅ No pop-ups or interstitials
- ✅ Clear "Advertisement" label
- ✅ Proper spacing from content

---

## Deployment & Hosting

### Where It's Hosted
Live site: https://cics-qrgenerator.site/

### Deployment Steps
1. Commit changes to `ui-overhaul` or `main` branch
2. Push to GitHub
3. (If GitHub Pages enabled) Automatically deployed
4. Or: Manual upload to web host (just copy all files)

### Files Required on Server
- All `.html` pages
- `js/script.js` and `css/style.css`
- `service-worker.js` and `manifest.json`
- `assets/` folder (images, fonts)
- Recommended: `404.html` (custom error page)

### HTTPS Required
- PWA (Service Worker) requires HTTPS
- Analytics tracking requires HTTPS
- Already deployed on HTTPS at cics-qrgenerator.site

---

## Documentation Files

- **MODERNIZATION_GUIDE.md** - Comprehensive guide to recent changes (glassmorphism removal, Google Ads setup, CSS structure)
- **UI_CHANGES_SUMMARY.md** - Visual before/after of design modernization
- **README.md** - User-facing features and usage instructions

---

## Recent Major Changes (April 2026)

1. **Removed Problematic Ads**
   - ❌ Deleted scripts from `effectivegatecpm.com`, `adsterra.com`, etc.
   - ⚠️ These were causing unexpected popups and violating Google policies
   - ✅ Replaced with clean Google Ads placeholders

2. **Modernized UI Design**
   - Navbar: Glassmorphism → Solid gradient
   - Navigation: Pill buttons → Rounded squares
   - Ad section: Complex animation → Simple static placeholder

3. **Updated Privacy Policy**
   - ✅ Fully transparent about data handling (no personal data collected)
   - ✅ Clear disclosure of Google Ads
   - ✅ Removed mentions of removed ad networks

4. **Enhanced Documentation**
   - Added MODERNIZATION_GUIDE.md (11KB of setup instructions)
   - Added UI_CHANGES_SUMMARY.md (visual guide)
   - Improved JavaScript JSDoc comments

---

## Debugging Tips

### "QR Code not generating"
**Check:**
1. Browser console for JavaScript errors (F12)
2. Verify input fields are populated (ID + Name)
3. QRCode.js library loaded: View network tab, check CDN URL
4. Canvas element exists in HTML

### "Dark mode not working"
**Check:**
1. `body.dark-mode` class is added (inspect body tag)
2. CSS dark mode rules exist (search `.dark-mode` in style.css)
3. Theme toggle button is functional (check click event)
4. localStorage has "theme" key set

### "Service Worker not caching"
**Check:**
1. HTTPS enabled (required for Service Worker)
2. manifest.json is valid
3. CACHE_NAME version in service-worker.js
4. Unregister old workers in DevTools → Application → Service Workers

### "ZIP download not working"
**Check:**
1. JSZip library loaded from CDN
2. At least one QR is selected (checkbox checked)
3. Browser supports Blob and URL.createObjectURL
4. Check console for zip generation errors

---

## Standards & Conventions

- **HTML:** Semantic HTML5, accessibility (alt text, labels, ARIA)
- **CSS:** BEM-inspired classes, CSS variables, mobile-first media queries
- **JavaScript:** ES6+, JSDoc comments, snake_case for private vars, camelCase for public
- **Naming:** Descriptive names (`generateQR` not `doGen`), prefixed modals (`.modal-`, `.alert-`, `.confirm-`)
- **Commits:** Conventional format `feat:`, `fix:`, `docs:`, etc.

---

## Contact & Support

- **Developer:** Jeylo Baoit
- **Email:** jeylodigitals@gmail.com
- **Live Site:** https://cics-qrgenerator.site/
- **Repository:** (Check git remote for GitHub URL)

---

**Last Updated:** April 5, 2026
**Maintained by:** Jeylo Baoit
