#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_PATH="$ROOT_DIR/contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm"
NODE_ADDRESS="${CASPER_NODE_ADDRESS:-https://node.testnet.casper.network}"
CHAIN_NAME="${CASPER_CHAIN_NAME:-casper-test}"
SECRET_KEY="${CASPER_SECRET_KEY:-$HOME/.casper/proofpay-testnet-20260623/secret_key.pem}"
PAYMENT_AMOUNT="${CASPER_PAYMENT_AMOUNT:-30000000000}"
GAS_PRICE_TOLERANCE="${CASPER_GAS_PRICE_TOLERANCE:-1}"
SCENARIO="${PROOFPAY_SCENARIO:-clean}"

if ! command -v casper-client >/dev/null 2>&1; then
  echo "casper-client is not installed. Run: cargo install casper-client"
  exit 1
fi

if [ ! -f "$SECRET_KEY" ]; then
  echo "Secret key not found: $SECRET_KEY"
  echo "Set CASPER_SECRET_KEY to the funded Testnet account secret_key.pem."
  exit 1
fi

if [ ! -f "$WASM_PATH" ]; then
  bash "$ROOT_DIR/scripts/build-contract.sh"
fi

if [ -z "${PROOFPAY_EVIDENCE_HASH:-}" ] || [ -z "${PROOFPAY_DECISION_HASH:-}" ]; then
  eval "$("$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/export-attestation-payload.ts" --env "$SCENARIO")"
fi

PUBLIC_KEY_FILE="$(dirname "$SECRET_KEY")/public_key_hex"
if [ -f "$PUBLIC_KEY_FILE" ]; then
  if ! casper-client get-account --node-address "$NODE_ADDRESS" --account-identifier "$PUBLIC_KEY_FILE" >/dev/null; then
    echo "Funded account not found on Testnet for public key:"
    cat "$PUBLIC_KEY_FILE"
    echo
    echo "Request Testnet tokens at https://testnet.cspr.live/tools/faucet before deploying."
    exit 2
  fi
fi

casper-client put-transaction session \
  --node-address "$NODE_ADDRESS" \
  --chain-name "$CHAIN_NAME" \
  --secret-key "$SECRET_KEY" \
  --wasm-path "$WASM_PATH" \
  --payment-amount "$PAYMENT_AMOUNT" \
  --standard-payment true \
  --gas-price-tolerance "$GAS_PRICE_TOLERANCE" \
  --install-upgrade \
  --session-entry-point call \
  --session-arg "milestone_id:string='$PROOFPAY_MILESTONE_ID'" \
  --session-arg "evidence_hash:string='$PROOFPAY_EVIDENCE_HASH'" \
  --session-arg "decision:string='$PROOFPAY_DECISION'" \
  --session-arg "decision_hash:string='$PROOFPAY_DECISION_HASH'" \
  --session-arg "confidence:u64='$PROOFPAY_CONFIDENCE'" \
  --session-arg "risk_score:u64='$PROOFPAY_RISK_SCORE'"
