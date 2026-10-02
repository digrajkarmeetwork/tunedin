#!/usr/bin/env bash
# Shared setup for CI scripts: Playwright + Chromium (cached by npm between steps).
set -euo pipefail
node --version
npm install --no-save --no-package-lock playwright@1.56.0
npx playwright install --with-deps chromium
