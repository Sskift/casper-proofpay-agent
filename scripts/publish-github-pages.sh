#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/apps/web/out"
PUBLISH_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$PUBLISH_DIR"
}
trap cleanup EXIT

npm run pages:build

cp -R "$OUT_DIR"/. "$PUBLISH_DIR"/

git -C "$PUBLISH_DIR" init
git -C "$PUBLISH_DIR" checkout -b gh-pages
git -C "$PUBLISH_DIR" add .
git -C "$PUBLISH_DIR" commit -m "Deploy GitHub Pages"
git -C "$PUBLISH_DIR" remote add origin git@github.com:Sskift/casper-proofpay-agent.git
git -C "$PUBLISH_DIR" push --force origin gh-pages
