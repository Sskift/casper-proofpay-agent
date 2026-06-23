#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_DIR="$ROOT_DIR/contracts/proofpay-attestation"
WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm"

rustup target add wasm32-unknown-unknown

cd "$CONTRACT_DIR"
cargo build --release --target wasm32-unknown-unknown

echo "Built ProofPay attestation contract:"
echo "$WASM_PATH"
