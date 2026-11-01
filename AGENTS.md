# RC Grid

Lightweight RC race management app: racers follow tracks and register for races, track owners create races, and admins approve new tracks.

## Stack

- Plain HTML + vanilla JS (one ES module, no framework, no build step, no package.json)
- Firebase v10.8.0, loaded from the gstatic CDN: Auth (email magic link) and Firestore
- Hosted on GitHub Pages: https://yonicozac.github.io/RC-Grid/ (deploys from `main`)
- Firebase project: `rc-grid-faae7`

## Files

- `index.html`: the whole UI layout plus all CSS in one `<style>` block (CSS variables on `:root`, accent `#e85d04`)
- `app.js`: all app logic (auth, navigation, rendering, Firestore calls)
- `firestore.rules`: security rules, the real access control
- `firebase.json`: points the Firebase CLI at the rules file
- `event-app-plan.md`: original planning doc, **outdated**. Trust the code instead.

## Roles

- **Racer**: any signed-in user with a name set. Can follow tracks and register for races.
- **Track owner**: the `createdBy` uid on a track. Can create races for that track and delete them (Delete race on the race card).
- **Admin**: a doc exists at `admins/{uid}` (created manually, never written by the client). Approves or rejects pending tracks, and can delete any race.
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
  uid, email, name, registeredAt
  entries: [{ category, transponder? }]   // one per category the driver entered
  // legacy docs: categories: string[] + transponder? (read via regEntries())
```

## App flow

1. Sign in with a magic link (`actionCodeSettings.url` is hardcoded to the GitHub Pages URL).
2. On first login, the user sets a name in `users/{uid}`.
3. There are two views:
   - **Races** (default): races from followed tracks, sorted by date. Register/unregister each category independently; clicking Register asks for that category's transponder (optional). Each card shows driver counts (total and per category) and a collapsible list of registered drivers.
   - **Tracks**: approved tracks with search, sorted by distance when location is known (location cached in `localStorage` as `rcgrid_location`, cleared on logout). Includes follow (heart), the submit-track form, the admin pending queue, and the owner's "Add Race" panel.

## Conventions

- Keep it dependency-free: no frameworks, bundlers, or npm.
- Build DOM with `document.createElement`. Any user-provided string interpolated into `innerHTML` must go through `esc()`, and links through `safeHref()`.
- `app.js` is split into sections by `/* ---------------- Section ---------------- */` comment banners. Put new code in the matching section.
- After a mutation, re-render by calling the view loader again (for example `loadRacesView()`).
- Deleting a race uses a batched write that also deletes its `registrations` docs (Firestore doesn't cascade subcollection deletes).
- Any change to permissions or data shape needs a matching `firestore.rules` update. Deploy with `firebase deploy --only firestore:rules`.

## Gotchas

- `loadRacesView` uses a Firestore `where("trackId", "in", ...)` query, which is capped at 30 values. That breaks if a user follows more than 30 tracks.
- Magic-link sign-in redirects to production, so testing locally needs the auth URL changed or a sign-in on the live site.
