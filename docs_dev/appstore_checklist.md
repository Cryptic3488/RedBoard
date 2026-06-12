# RedBoard — App Store Submission Checklist

**Last updated:** 2026-06-12
**Status:** Phase 7 (App Store submission) in progress — iOS privacy files done, awaiting Mac build + App Store Connect actions
**Repo:** github.com/Cryptic3488/RedBoard
**Bundle ID:** com.arborik.redboard
**Apple ID:** abyerly3488@gmail.com
**Supabase project:** hrwcudlahhvokyvabext.supabase.co

---

## Checklist Legend
- ✅ Done
- ⏳ Ready — just needs to be pasted/filled in App Store Connect
- ❌ Not started
- ⚠️ Needs investigation or code fix

---

## Handoff — Switching to Mac

> **For a new Claude instance:** All code changes are committed. The remaining blockers are split between Mac/Xcode actions and App Store Connect (browser). Work through them in this order:

### Step 1 — App Store Connect (browser, do first — no Mac needed)
1. **Agreements (E2):** App Store Connect → Agreements, Tax, and Banking → confirm "Paid Applications" is active
2. **Nutrition label (D3/D4):** App Store Connect → your app → App Privacy → add **Health & Fitness** data type (linked, not tracking, App Functionality purpose)
3. **Metadata (A5–A12):** Paste from `docs_dev/appstore_metadata.md` — Description, Keywords, Copyright (`2026 Andrew Byerly`), Promotional Text, What's New (`Initial release.`)

### Step 2 — Mac: sync repo + build
```bash
git pull                          # get latest (privacy fixes committed)
npm install
npm run build
npx cap sync ios
```
Then open `ios/App/App.xcworkspace` in Xcode.

### Step 3 — Xcode checks before archiving
- [ ] **C5:** Deployment target ≥ iOS 13 (General → Minimum Deployments)
- [ ] **Signing:** Team = Mynago's Apple Developer account, Bundle ID = `com.arborik.redboard`
- [ ] **Version:** Marketing Version = `1.0`, Build = `25` (or next unused number)

### Step 4 — Archive + Upload
Product → Archive → Distribute App → App Store Connect → Upload
When prompted: Export Compliance → "None of the algorithms mentioned above" (C4)

### Step 5 — TestFlight + Screenshots
- Confirm build appears in TestFlight and works (no black screen) → C2
- Take screenshots on iPhone: **6.9"** (1320×2868) and **6.7"** (1290×2796) → B1/B2
  - Screens needed: Login, Feed/Home, Film, Stats, Wellness, Playbook or Dashboard
  - Avoid any Hudl branding visible (B9)

### Step 6 — App Store Connect: finalize submission
- Attach Build 25 to the 1.0 submission (C3)
- Upload screenshots (B1/B2)
- Set up reviewer credentials (F1): create one admin test account + one player test account in your app with visible data (stats, film link, wellness response)
- Fill in reviewer notes using the template in section F below
- Submit for review

---

## A. App Store Connect — Metadata
| # | Item | Status |
|---|------|--------|
| A1 | App Name: RedBoard | ✅ |
| A2 | Subtitle: Film, Stats & Wellness | ✅ |
| A3 | Category: Sports | ✅ |
| A4 | Age Rating: 4+ | ✅ |
| A5 | Description | ⏳ Paste from `docs_dev/appstore_metadata.md` |
| A6 | Keywords | ⏳ Paste from `docs_dev/appstore_metadata.md` |
| A7 | Support URL | ✅ Live |
| A8 | Privacy Policy URL | ✅ Live |
| A9 | Copyright | ⏳ Enter: `2026 Andrew Byerly` |
| A10 | Promotional Text (170 chars, optional) | ❌ |
| A11 | What's New in This Version | ⏳ Enter: `Initial release.` |
| A12 | Primary language: English (U.S.) | ⏳ Confirm |

---

## B. Screenshots & Media
| # | Item | Status |
|---|------|--------|
| B1 | 6.9" screenshots — 1320×2868px (iPhone 16 Pro Max) | ❌ Required |
| B2 | 6.7" screenshots — 1290×2796px (iPhone 15/16 Plus) | ❌ Required |
| B3–B8 | Screens: Login, Feed, Film, Stats, Wellness, Playbook/Dashboard | ❌ |
| B9 | Avoid Hudl branding visible in screenshots | ⚠️ |

> Capture from TestFlight Build 25 on iPhone. Need at least 1 screenshot per required device size.

---

## C. Build & Technical
| # | Item | Status |
|---|------|--------|
| C1 | Build 25 uploaded to TestFlight | ⏳ Run `npm run build && npx cap sync ios` → Archive → Upload |
| C2 | Build 25 confirmed working on TestFlight (no black screen) | ⏳ |
| C3 | Build 25 attached to 1.0 submission in App Store Connect | ⏳ |
| C4 | Export Compliance: "None of the algorithms mentioned above" | ⏳ Answer when prompted |
| C5 | Minimum iOS deployment target set in Xcode (should be iOS 13+) | ⚠️ Verify in Xcode |
| C6 | `NSPrivacyAccessedAPITypes` in PrivacyInfo.xcprivacy — currently empty | ✅ Added NSUserDefaults / CA92.1 |
| C7 | Password reset deep link broken (known) | ⚠️ Document in reviewer notes, not a blocker |
| C8 | `armv7` in Info.plist — deprecated, consider removing | ✅ Changed to arm64 |

**C6 Note:** Capacitor likely uses `NSUserDefaults` internally. Apple requires declaring required-reason APIs. Check Capacitor 8 docs for what to declare in `NSPrivacyAccessedAPITypes`. If left empty and Apple detects usage, this is a rejection reason.

---

## D. Privacy & Data Compliance
| # | Item | Status |
|---|------|--------|
| D1 | Privacy Policy live | ✅ |
| D2 | Privacy Policy covers all data types (email, name, stats, wellness, files) | ⚠️ Read `docs/privacy.html` and verify |
| D3 | App Privacy nutrition label in App Store Connect | ✅ Name, Email, Other User Content declared |
| D4 | Wellness data — may qualify as Health & Fitness under Apple's categories | ✅ Classified as Health. Added `NSPrivacyCollectedDataTypeHealth` to xcprivacy. Add "Health & Fitness" in App Store Connect nutrition label too. |
| D5 | `PrivacyInfo.xcprivacy` missing `NSPrivacyCollectedDataTypeOtherUserContent` | ✅ Added |
| D6 | No third-party tracking SDKs | ✅ |
| D7 | No ATT prompt needed (`NSPrivacyTracking = false`) | ✅ |
| D8 | Data retention + account deletion mentioned in Privacy Policy | ⚠️ Add if missing |
| D10 | **Account deletion — DONE** | ✅ See below |

**D10 — Account Deletion (complete):**
- Edge function `supabase/functions/delete-self/index.ts` deployed to Supabase
- UI added to `src/pages/app/Profile.tsx` — "Delete account" row in Account section
- Tap → inline confirmation → "Yes, delete" → calls edge function → cascades all data → signs out
- Deletes avatar from storage + auth user (profiles + all related rows cascade)

---

## E. Legal & Business
| # | Item | Status |
|---|------|--------|
| E1 | Apple Developer Program active | ✅ |
| E2 | Paid Applications agreement signed in App Store Connect | ⚠️ Check Agreements, Tax, and Banking |
| E3 | Copyright filled in | ⏳ |
| E5 | App is free | ✅ |
| E6 | No IAP | ✅ |
| E7 | Denison University branding — confirm informal permission from coaching staff | ⚠️ |

---

## F. App Store Review Preparation
| # | Item | Status |
|---|------|--------|
| F1 | **Reviewer credentials** — admin login + player login | ❌ Critical — instant rejection without these |
| F2 | Review notes explaining invite-only app | ❌ |
| F3 | Note about broken password reset in reviewer notes | ⏳ |
| F4 | Test accounts have visible data (stats, film, wellness) | ⚠️ Verify |
| F5 | Reviewer contact phone number | ⏳ Required field |

**Suggested reviewer notes template:**
```
This is a private team management app for Denison University Women's Basketball.
Accounts are invitation-only — there is no self-registration.

Test credentials:
  Admin: [email] / [password]
  Player: [email] / [password]

Note: Password reset email deep linking is not functional in v1.0.
Users contact the admin to reset passwords. This is a known limitation
and does not affect core functionality.
```

---

## Priority Order (what to do next)
1. ~~**D5** — Add `NSPrivacyCollectedDataTypeOtherUserContent` to `ios/App/App/PrivacyInfo.xcprivacy`~~ ✅
2. ~~**C6** — Research Capacitor 8 required-reason APIs and populate `NSPrivacyAccessedAPITypes`~~ ✅
3. ~~**D4** — Decide if wellness responses = Health data; update label + xcprivacy if so~~ ✅ xcprivacy done — still need to add Health & Fitness in App Store Connect nutrition label
4. **E2** — Verify Paid Applications agreement is signed in App Store Connect
5. **F1/F2** — Prepare reviewer credentials + notes (template in F section above)
6. **B1/B2** — Take screenshots on iPhone from TestFlight Build 25
7. **C1–C3** — Build (`npm run build && npx cap sync ios`), Archive in Xcode, upload Build 25
8. **A5–A12** — Paste remaining metadata into App Store Connect

---

## Key File Locations
- App Store metadata (description, keywords): `docs_dev/appstore_metadata.md`
- Privacy policy: `docs/privacy.html`
- iOS privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`
- iOS Info.plist: `ios/App/App/Info.plist`
- Account deletion edge function: `supabase/functions/delete-self/index.ts`
- Player profile page (delete UI): `src/pages/app/Profile.tsx`
- Full project context: `HANDOFF.md`
