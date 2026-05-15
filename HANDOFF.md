# RedBoard — Session Handoff

## Project
React + TypeScript + Vite SPA wrapped in Capacitor iOS. Team management app for Denison Women's Basketball (20-30 users). Deployed to TestFlight, targeting App Store submission.

**Repo:** github.com/Cryptic3488/RedBoard (public)
**Branch:** main
**Supabase project:** hrwcudlahhvokyvabext.supabase.co
**Bundle ID:** com.arborik.redboard
**Apple Developer:** Individual account — abyerly3488@gmail.com
**Studio:** Arborik (not yet an LLC)

---

## Current Status

### Phases Complete
- Phase 0–5: Foundation, auth, security, iOS prep ✅
- Phase 6: Capacitor iOS wrapper ✅ (manual Xcode archive + upload to TestFlight)
- Phase 7: App Store submission — IN PROGRESS

### Phase 7 Status
| Item | Status |
|---|---|
| App record in App Store Connect | ✅ com.arborik.redboard |
| Category: Sports, Age Rating: 4+ | ✅ |
| App Privacy / Data types published | ✅ Name, Email, Other User Content |
| Privacy Policy URL | ✅ https://cryptic3488.github.io/RedBoard/privacy.html |
| Support URL | ✅ https://cryptic3488.github.io/RedBoard/support.html |
| Description + Keywords | ⏳ Ready to paste — see docs_dev/appstore_metadata.md |
| Copyright | ⏳ User to fill in (suggest: 2026 Andrew Byerly) |
| Screenshots | ❌ Not yet captured — user will take from iPhone on latest build |
| Build attached to submission | ⏳ Pending Build 33 (see below) |

**Metadata file:** `docs_dev/appstore_metadata.md` — contains full description, keywords, URLs ready to paste into App Store Connect.

---

## Immediate Next Steps

### 1. Take screenshots on iPhone (Build 33 — all known issues resolved)
Once Build 25 is confirmed working, take screenshots of:
- Login page
- Feed (with stats cards visible)
- Film (with clips)
- Stats page
- Wellness form
- Playbook

Required size: at least 6.9" (iPhone 16 Pro Max) — 1320×2868px. Upload to App Store Connect → 1.0 Prepare for Submission → Screenshots.

### 4. Attach build + Submit
- Attach Build 25 to the 1.0 submission
- Fill description/keywords from appstore_metadata.md
- Click **Add for Review**

---

## Key Technical Details

### Manual TestFlight Workflow (ALWAYS use this — Xcode Cloud post-action hangs)
1. `npm run build && npx cap sync ios`
2. Xcode → **Product → Archive**
3. Organizer → **Distribute App → App Store Connect → Upload**
4. In TestFlight: answer **Missing Compliance → None of the algorithms**

### Black Screen Fix (commit 1b92d1d)
Root cause: `SplashScreen.hide()` was in `main.tsx` and fired before React rendered.
Fix: Moved to `App.tsx` `useEffect`:
```tsx
useEffect(() => {
  SplashScreen.hide().catch(() => {})
}, [])
```

### Password Reset Deep Link (fixed in Build 27)
Uses custom URL scheme `com.arborik.redboard://reset-password`. 
- `Info.plist` registers `com.arborik.redboard` as a URL scheme
- `DeepLinkHandler.tsx` listens for `appUrlOpen` via `@capacitor/app`, parses the hash tokens, calls `supabase.auth.setSession()`, navigates to `/reset-password`
- `ForgotPassword.tsx` uses `com.arborik.redboard://reset-password` on native, falls back to `VITE_APP_URL` on web
- **Supabase dashboard action required**: Authentication → URL Configuration → Redirect URLs → add `com.arborik.redboard://`

### Overscroll Black Boxes (fixed Build 33)
Root cause: WKWebView rubber-band runs inside WebCore, not the UIScrollView layer. `scrollView.bounces=false` (which Capacitor already sets) does not reach it. Also, `contentInset:'automatic'` was injecting top/bottom inset regions that users could scroll into.

Fix (two parts):
1. `App.tsx`: `touchmove` + `preventDefault()` at document level (`passive:false`) — intercepts before WebKit animates rubber-band
2. `capacitor.config.ts`: `contentInset:'never'` — removes iOS-injected inset regions; CSS `env(safe-area-inset-*)` handles layout instead

**Dead ends — do not retry:** ViewController subclassing (breaks Capacitor bridge init), `scrollView.bounces=false` in AppDelegate, `overscroll-behavior:none` CSS (WebKit bug), removing `overflow-y:auto` from layouts (bounce was never from CSS containers).

---

## App Architecture

### Tech Stack
- Vite + React + TypeScript + Tailwind CSS
- Supabase (auth, database, storage, edge functions)
- Capacitor 8 (iOS wrapper)
- GitHub Pages (privacy policy hosting)

### Design System
- Brand red: `#C8102E` (Tailwind: `brand`)
- **Player side:** social/consumer feel — Feed, Stats, Film, Wellness, Playbook, Profile
- **Admin side:** coach dashboard feel — Dashboard, Roster, Film, Stats, Wellness, Playbook
- Custom SVG icons: `src/components/icons.tsx` (22 icons, zero bundle overhead)
- Dark mode: class-based via ThemeContext

### Key Config Files
- `capacitor.config.ts` — app ID, plugin config, server allowNavigation
- `.env.local` — Supabase URL/key, VITE_APP_URL (NOT committed)
- `ios/ExportOptions.plist` — Xcode export config
- `src/index.css` — safe area utilities, font-size !important for iOS zoom fix

### Safe Area Utilities (src/index.css)
```css
.pb-safe      /* env(safe-area-inset-bottom) */
.pt-safe-top  /* env(safe-area-inset-top) */
.pb-nav-safe  /* 5rem + env(safe-area-inset-bottom) */
```

### iOS Zoom Fix
All inputs/textareas/selects have `font-size: 1rem !important` in index.css to prevent iOS auto-zoom on focus.

---

## Open Issues / Post-Submission

### Phase 8 (Post-Launch)
- Push notifications (APNs setup required)
- Player last-seen tracking
- Signed URL refresh for Playbook files
- Offline state handling

### Known Gaps
- Password reset deep link doesn't work in app (needs redboard.drewn8n.com)
- Wellness text responses not fully tested in production
- Admin Wellness has 6 nav items (mobile nav shows 5, Desktop sidebar shows all 6)
- Overscroll rubber-band still visible (native fix was reverted)

---

## Installed Skills
- `skills-discovery` — search claude-plugins.dev registry
- `supabase-postgres-best-practices` — Supabase/Postgres guidance
- `webapp-testing` — Playwright UI testing
- `apple-hig-designer` — iOS HIG design principles
- `ui-ux-pro-max` — UI/UX design guidance
- `tailwind-design-system` — Tailwind design patterns
- `ui-styling` — UI styling guidance
- `media-processing` — FFmpeg/ImageMagick for image manipulation
- `svg-icon-generator` — SVG icon generation
- `ckm:design` (ui-ux-pro-max/design) — comprehensive design skill

---

## Important URLs
- Privacy Policy: https://cryptic3488.github.io/RedBoard/privacy.html
- Support: https://cryptic3488.github.io/RedBoard/support.html
- App Store Connect: appstoreconnect.apple.com → RedBoard
- Supabase Dashboard: supabase.com → RedBoard project
- GitHub: github.com/Cryptic3488/RedBoard
