# RC Grid

Lightweight RC race management app: racers follow tracks and register for races, track owners create races, and admins approve new tracks.

## Stack

- Plain HTML + vanilla JS (two ES modules, `app.js` and `i18n.js`; no framework, no build step, no package.json)
- Firebase v10.8.0, loaded from the gstatic CDN: Auth (Google sign-in + email magic link fallback) and Firestore
- Hosted on GitHub Pages: https://yonicozac.github.io/RC-Grid/ (deploys from `main`)
- Firebase project: `rc-grid-faae7`

## Files

- `index.html`: the whole UI layout plus all CSS in one `<style>` block (CSS variables on `:root`, accent `#e85d04`)
- `app.js`: all app logic (auth, navigation, rendering, Firestore calls)
- `i18n.js`: UI strings for English, Hebrew and French, language detection, the globe language picker, and date/number formatting
- `firestore.rules`: security rules, the real access control
- `firebase.json`: points the Firebase CLI at the rules file
- `event-app-plan.md`: original planning doc, **outdated**. Trust the code instead.

## Roles

- **Racer**: any signed-in user with a name set. Can follow tracks and register for races.
- **Track owner**: the `createdBy` uid on a track. Can delete the track (with all its races), create races for it, delete them (Delete race on the race card), and remove drivers from a category (× in the driver list).
- **Admin**: a doc exists at `admins/{uid}` (created manually, never written by the client). Approves or rejects pending tracks, and can delete any track or race, or remove any driver.
- Anyone signed in can submit a track. It starts as `pending`, and only an admin can change its status.

## Data model

```
admins/{uid}

users/{uid}
  name
  transponder?             // last-used transponder, prefills registration
users/{uid}/following/{trackId}
  followedAt

tracks/{trackId}
  name, location, website?, description?
  lat?, lng?               // taken from the creator's geolocation at submit time
  status: "pending" | "approved"   // rejected tracks are deleted
  createdBy, createdAt

races/{raceId}
  name, date (YYYY-MM-DD string, no time)
  trackId, trackName (denormalized), trackLat?, trackLng?
  categories: [{ name }]   // older races may still carry capacity/totalCapacity (unused)
  createdBy, createdAt
races/{raceId}/registrations/{uid}
  uid, name, registeredAt  // no email: every signed-in user can read registrations
  entries: [{ category, transponder? }]   // one per category the driver entered
  // legacy docs: categories: string[] + transponder? (read via regEntries())
```

## App flow

1. Sign in with Google (`signInWithPopup`, the primary option) or an email magic link (`actionCodeSettings.url` is hardcoded to the GitHub Pages URL). Magic links are capped at 5 emails/day on the Spark plan and break when the link opens in a different/private browser, which is why Google is primary.
2. On first login, the user sets a name in `users/{uid}` (prefilled from the Google account name when available).
3. The top-right profile button (initial + name; initial only on phones) opens a menu with **Profile** (dialog to change the name in `users/{uid}`) and **Log out**. A renamed user's existing registrations keep the old name until they next register or unregister, since `name` is copied onto each registration.
4. There are two views:
   - **Races** (default): upcoming races (date ≥ today, local time) from followed tracks, soonest first. Past races sit in a collapsed, low-key "Past races" section (most recent first, registration closed), shown only when there are any. Register/unregister each category independently; clicking Register asks for that category's transponder (optional). Each card shows driver counts (total and per category) and a collapsible list of registered drivers. Anyone can download the list as a RaceLyx-compatible CSV (`Name,Class,Transponder`, one row per driver per class, UTF-8 with BOM). Names are normalized in the export only (`normalizeName`: trimmed, each word capitalized, e.g. "dana LEVI" → "Dana Levi") so case differences don't create duplicate drivers in the timing software.
   - **Tracks**: approved tracks with search: your own tracks first, then by distance when location is known (no location last), then by name (location cached in `localStorage` as `rcgrid_location`, cleared on logout). Includes a Follow / ✓ Following button (text, not an icon: iOS renders ♥ as a red emoji), the submit-track form, the admin pending queue, and the owner's "Add Race" panel.

## Localization

- Languages: English (`en`), Hebrew (`he`, right-to-left), French (`fr`). The choice is stored on the device as `localStorage.rcgrid_lang` (kept on logout), never on the user's record.
- Default when nothing is stored: Hebrew if any of the browser's languages is Hebrew, or the time zone is Israel's; otherwise English. French is only ever chosen by hand.
- The globe button (current language code inside) sits in the top bar, and in the top corner on the sign-in screens. Picking a language saves it and reloads the page.
- `i18n.js` loads as its own `<script>` before `app.js`. It has no imports, so it translates the page and sets `<html lang dir>` while `app.js` is still waiting on Firebase.
- Static markup is translated with `data-i18n` (text), `data-i18n-placeholder` and `data-i18n-title`. In `app.js`, use `t("key")`, or `t("key", ...args)` for entries that are functions (plurals, names). Add every new string to all three languages.
- Race dates show through `formatDate()` (e.g. "Sat 14 Nov 2026"). The stored value stays `YYYY-MM-DD`.
- CSS uses logical properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`) so Hebrew mirrors correctly. Don't add `left`/`right` or `margin-left`/`margin-right` for anything that should flip.
- Heebo (Google Fonts) supplies Hebrew glyphs, since Inter and JetBrains Mono have none. Letter-spacing is turned off for Hebrew pages.
- User content (track and race names, categories) and the CSV export are not translated. The CSV header stays `Name,Class,Transponder` for RaceLyx.

## Conventions

- Keep it dependency-free: no frameworks, bundlers, or npm.
- Build DOM with `document.createElement`. Any user-provided string interpolated into `innerHTML` must go through `esc()`, and links through `safeHref()`.
- `app.js` is split into sections by `/* ---------------- Section ---------------- */` comment banners. Put new code in the matching section.
- After a mutation, re-render by calling the view loader again (for example `loadRacesView()`).
- Deleting a race uses a batched write that also deletes its `registrations` docs (Firestore doesn't cascade subcollection deletes). Deleting a track does the same for all its races (`deleteTrack`, chunked to stay under the 500-write batch limit). Other users' `following/{trackId}` docs for a deleted track are left behind; they're harmless but still count toward the 30-track `in` query limit.
- Registrations are readable by every signed-in user, so never store private data (like email) on them; the rules allow only the listed fields. A race's owner can edit only its `name`, `date` and `categories` (not `trackId` or `createdBy`).
- Any change to permissions or data shape needs a matching `firestore.rules` update. Deploy with `firebase deploy --only firestore:rules`.

## Gotchas

- Firestore is created with `initializeFirestore(app, { experimentalForceLongPolling: true })`. On iOS Safari the default streaming connection often stalls, and the SDK's auto-detection made loads take 10–30s. Don't switch back to `getFirestore()` without testing on an iPhone.
- Startup reads (profile, admin check, follows) run in parallel; views await `startupDataReady()` and show "Loading…", or an error with Retry. Non-admins can't read `admins/`, so a failed admin read means "not admin".

- `loadRacesView` uses a Firestore `where("trackId", "in", ...)` query, which is capped at 30 values. That breaks if a user follows more than 30 tracks.
- Magic-link sign-in redirects to production, so testing locally needs the auth URL changed or a sign-in on the live site.
