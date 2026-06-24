#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_DIR="$ROOT_DIR/contracts/proofpay-attestation"
WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm"

rustup target add wasm32-unknown-unknown

cd "$CONTRACT_DIR"
RUSTFLAGS="${RUSTFLAGS:-} -C target-feature=-bulk-memory" cargo build --release --target wasm32-unknown-unknown

if ! command -v wasm-opt >/dev/null 2>&1; then
  echo "Binaryen wasm-opt is required to lower Casper-incompatible bulk-memory ops." >&2
  echo "Install with: brew install binaryen" >&2
  exit 1
fi

RAW_WASM_PATH="$WASM_PATH.raw"
cp "$WASM_PATH" "$RAW_WASM_PATH"
wasm-opt "$RAW_WASM_PATH" \
  --llvm-memory-copy-fill-lowering \
  --strip-target-features \
  -Oz \
  -o "$WASM_PATH"
rm "$RAW_WASM_PATH"

if command -v wasm2wat >/dev/null 2>&1; then
  if wasm2wat "$WASM_PATH" | grep -E "memory\\.init|data\\.drop|memory\\.copy|memory\\.fill|table\\.init|elem\\.drop|table\\.copy" >/dev/null; then
    echo "Built Wasm still contains Casper-incompatible bulk-memory operations." >&2
    exit 1
  fi
fi

echo "Built ProofPay attestation contract:"
echo "$WASM_PATH"
