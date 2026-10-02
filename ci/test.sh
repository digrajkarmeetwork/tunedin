#!/usr/bin/env bash
# Runs on every push to main and every pull request (.github/workflows/ci.yml).
# All CI logic lives here so it can change without editing workflow files.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "::group::Validate config files"
node -e 'for (const f of ["vercel.json","manifest.webmanifest"]) { JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("valid", f) }'
echo "::endgroup::"

echo "::group::Check game script syntax"
node -e 'const h=require("fs").readFileSync("index.html","utf8"); const s=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]); s.forEach(c=>new Function(c)); console.log("ok", s.length, "inline scripts")'
echo "::endgroup::"

echo "::group::Install Playwright"
bash ci/setup.sh
echo "::endgroup::"

node tests/smoke.mjs
