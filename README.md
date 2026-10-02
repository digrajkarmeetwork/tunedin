# Tuned In

[![CI](https://github.com/digrajkarmeetwork/tunedin/actions/workflows/ci.yml/badge.svg)](https://github.com/digrajkarmeetwork/tunedin/actions/workflows/ci.yml)

A mind-reading dial party game (a Wavelength-style remake) for phones and desktop.

- **Play:** https://tunedin.meetdigrajkar.ca
- **Game:** `index.html` is the whole game in one file (UI, game logic, online rooms).
- **Online rooms:** Supabase Realtime (project `tuned-in`). No database tables.
- **Hosting:** Vercel deploys this repo on every push to `main`.
- **Privacy policy:** `privacy.html` (served at `/privacy`).

## CI/CD

1. **CI** runs on every push to `main` and every pull request. It validates `vercel.json` and the manifest, syntax-checks the game script, then runs `tests/smoke.mjs` in headless Chromium (phone + desktop boot, a full one-phone In Sync round, scoring and online hidden-answer rules).
2. **CD** is Vercel's Git integration: pull requests get a preview URL, merges to `main` go live.
3. **Live check** re-runs the smoke test against https://tunedin.meetdigrajkar.ca after each successful production deploy. You can also run it by hand from the Actions tab.

The workflow files in `.github/workflows/` are deliberately thin: they only decide *when* to run and then call a script. All the logic lives in `ci/`:

| Script | Runs | Does |
| --- | --- | --- |
| `ci/test.sh` | CI, on pushes and pull requests | config + syntax checks, smoke test |
| `ci/live-check.sh` | after production deploys | smoke test against the live site |
| `ci/setup.sh` | used by both | installs Playwright + Chromium |

To change what CI does, edit the scripts, not the workflows.

Run the test locally:

```sh
npm install --no-save playwright@1.56.0 && npx playwright install chromium
node tests/smoke.mjs                                           # this folder
BASE_URL=https://tunedin.meetdigrajkar.ca node tests/smoke.mjs # live site
```

`ci/`, `tests/` and `.github/` are listed in `.vercelignore`, so they are not published.
