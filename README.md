# Tuned In

A mind-reading dial party game (a Wavelength-style remake) for phones and desktop.

- **Play:** https://tunedin.meetdigrajkar.ca
- **Game:** `index.html` is the whole game in one file (UI, game logic, online rooms).
- **Online rooms:** Supabase Realtime (project `tuned-in`). No database tables.
- **Hosting:** Vercel deploys this repo on every push to `main`.
- **Privacy policy:** `privacy.html` (served at `/privacy`).

## CI/CD

1. **CI** (`.github/workflows/ci.yml`) runs on every push and pull request: validates `vercel.json` and the manifest, syntax-checks the game script, then runs `tests/smoke.mjs` in headless Chromium (phone + desktop boot, a full one-phone In Sync round, scoring and online hidden-answer rules).
2. **CD** is Vercel's Git integration: pull requests get a preview URL, merges to `main` go live.
3. **Live check** (`.github/workflows/post-deploy.yml`) re-runs the smoke test against https://tunedin.meetdigrajkar.ca after each successful production deploy. You can also run it by hand from the Actions tab.

Run the test locally:

```sh
npm install --no-save playwright@1.56.0 && npx playwright install chromium
node tests/smoke.mjs                                           # this folder
BASE_URL=https://tunedin.meetdigrajkar.ca node tests/smoke.mjs # live site
```

`tests/` and `.github/` are listed in `.vercelignore`, so they are not published.
