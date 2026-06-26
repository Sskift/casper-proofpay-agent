#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CASE_FILE="${1:-${PROOFPAY_REAL_CASE_FILE:-}}"

if [ -z "$CASE_FILE" ]; then
  echo "Usage: npm run realcase:deploy:testnet -- <path/to/real-case.json>"
  exit 1
fi

eval "$("$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/prepare-real-case.ts" --env "$CASE_FILE")"
bash "$ROOT_DIR/scripts/deploy-casper-testnet.sh"
