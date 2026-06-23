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

if [ -z "${PROOFPAY_EVIDENCE_HASH:-}" ] || [ -z "${PROOFPAY_DECISION_HASH:-}" ]; then
  eval "$("$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/export-attestation-payload.ts" --env "$SCENARIO")"
fi

cat <<EOF
Legacy deploy command shape:

casper-client put-deploy \\
  --node-address "$NODE_ADDRESS" \\
  --chain-name "$CHAIN_NAME" \\
  --secret-key "$SECRET_KEY" \\
  --payment-amount "$PAYMENT_AMOUNT" \\
  --session-path "$WASM_PATH" \\
  --session-arg "milestone_id:string='$PROOFPAY_MILESTONE_ID'" \\
  --session-arg "evidence_hash:string='$PROOFPAY_EVIDENCE_HASH'" \\
  --session-arg "decision:string='$PROOFPAY_DECISION'" \\
  --session-arg "decision_hash:string='$PROOFPAY_DECISION_HASH'" \\
  --session-arg "confidence:u64='$PROOFPAY_CONFIDENCE'" \\
  --session-arg "risk_score:u64='$PROOFPAY_RISK_SCORE'"

Newer transaction command shape:

casper-client put-transaction session \\
  --node-address "$NODE_ADDRESS" \\
  --chain-name "$CHAIN_NAME" \\
  --secret-key "$SECRET_KEY" \\
  --wasm-path "$WASM_PATH" \\
  --payment-amount "$PAYMENT_AMOUNT" \\
  --gas-price-tolerance "$GAS_PRICE_TOLERANCE" \\
  --install-upgrade \\
  --session-entry-point call \\
  --session-arg "milestone_id:string='$PROOFPAY_MILESTONE_ID'" \\
  --session-arg "evidence_hash:string='$PROOFPAY_EVIDENCE_HASH'" \\
  --session-arg "decision:string='$PROOFPAY_DECISION'" \\
  --session-arg "decision_hash:string='$PROOFPAY_DECISION_HASH'" \\
  --session-arg "confidence:u64='$PROOFPAY_CONFIDENCE'" \\
  --session-arg "risk_score:u64='$PROOFPAY_RISK_SCORE'"

Before sending, confirm the installed CLI's exact argument grammar:

casper-client put-deploy --show-arg-examples
casper-client put-transaction session --show-simple-arg-examples
EOF
