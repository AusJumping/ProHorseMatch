#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Task merges must never seed, migrate or connect to an inherited database.
# Install/test/build children receive no application credentials. Runtime setup
# remains an explicit operation through the guarded redesign launcher.
clean_run() {
  env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" \
    CI=true "$@"
}

echo "Installing the locked dependencies..."
clean_run npm ci --include=dev --no-audit --no-fund

echo "Checking the merged code..."
clean_run node --test tests/*.test.mjs
clean_run node --import tsx --test client/src/lib/style-preview.test.ts

echo "Building the redesign without database or service credentials..."
clean_run env NODE_ENV=production VITE_REDESIGN_SANDBOX=true npm run build
echo "Post-merge setup complete. No database or external service setup was run."
