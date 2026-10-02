#!/usr/bin/env bash
# Runs after each successful production deploy (.github/workflows/post-deploy.yml).
set -euo pipefail
cd "$(dirname "$0")/.."
export BASE_URL="${BASE_URL:-https://tunedin.meetdigrajkar.ca}"

echo "::group::Install Playwright"
bash ci/setup.sh
echo "::endgroup::"

sleep "${LIVE_CHECK_DELAY:-20}"   # give the CDN a moment to pick up the new deploy
node tests/smoke.mjs
