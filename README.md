# RC Grid

A lightweight race registration app for RC (radio-controlled) car clubs. Racers follow their local tracks and sign up for races; track owners publish races and download the driver list for their timing software.

**Live:** https://yonicozac.github.io/RC-Grid/

## Features

- **Follow tracks** and see their upcoming races in one list, with past races tucked away below.
- **Register per category**, with your MyLaps transponder number (prefilled from your last race). Races can also be created without transponders, for a one-click sign-up.
- **Driver lists** for every race, showing nicknames when drivers set one.
- **CSV export** in LiveRC/LiveTime's registration format, ready for the race director to import.
- **Track owners** create and delete races for their tracks and can remove drivers. New tracks go to an admin for approval.
- **Six languages:** English, French, German, Italian, Spanish and Hebrew (right-to-left). Hebrew is picked automatically for Israeli devices; everything else is one tap on the globe button.
- **Sign in** with Google, or with a magic link by email.

## How it's built

There's no framework, no build step and no npm. The whole app is three files served as static pages:

| File | What's in it |
|---|---|
| `index.html` | Page layout and all the CSS |
| `app.js` | App logic: auth, views, Firestore reads and writes |
| `i18n.js` | Translations, language detection and date formatting |
| `firestore.rules` | Security rules: who can read and write what |

The backend is [Firebase](https://firebase.google.com/): Authentication for sign-in and Firestore for data, loaded from Google's CDN. The site is hosted on GitHub Pages.

**Is it safe that the code is public?** Yes. The Firebase config in `app.js` is meant to be public, since every browser downloads it anyway. Access is enforced by Firebase Auth and the rules in `firestore.rules`, which run on Google's servers. Registrations, which every signed-in user can read, never store email addresses.

## Running it locally

Any static file server works:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123. Google sign-in works on localhost if it's listed under the Firebase project's authorized domains. Magic links always redirect to the live site.

## Running your own copy

1. Create a Firebase project. Turn on **Authentication** (Google, plus Email link if you want it) and **Firestore**.
2. Replace `firebaseConfig` in `app.js` with your project's config, and point `actionCodeSettings.url` at your own site.
3. Add your site's domain under Authentication → Settings → Authorized domains.
4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Host the files anywhere static (GitHub Pages, Firebase Hosting, Netlify…).
6. To make yourself an admin, sign in once, then create a document at `admins/{your uid}` in the Firestore console. Admins approve new tracks.

## Contributing

Bug reports and pull requests are welcome. [AGENTS.md](AGENTS.md) describes the data model, conventions and gotchas in detail. Any change to data shape or permissions needs a matching update to `firestore.rules`.

For questions, use the **Contact support** link at the bottom of the app.

## License

[Apache 2.0](LICENSE)
