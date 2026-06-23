#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_PATH="$ROOT_DIR/contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm"

NODE_ADDRESS="${CASPER_NODE_ADDRESS:-[NODE_ADDRESS]}"
CHAIN_NAME="${CASPER_CHAIN_NAME:-casper-test}"
SECRET_KEY="${CASPER_SECRET_KEY:-[KEY_PATH]/secret_key.pem}"
PAYMENT_AMOUNT="${CASPER_PAYMENT_AMOUNT:-30000000000}"
GAS_PRICE_TOLERANCE="${CASPER_GAS_PRICE_TOLERANCE:-1}"

MILESTONE_ID="${PROOFPAY_MILESTONE_ID:-ms-delivery-acceptance}"
EVIDENCE_HASH="${PROOFPAY_EVIDENCE_HASH:-0x<evidence_hash_from_dashboard>}"
DECISION="${PROOFPAY_DECISION:-approve}"
DECISION_HASH="${PROOFPAY_DECISION_HASH:-0x<decision_hash_from_dashboard>}"
CONFIDENCE="${PROOFPAY_CONFIDENCE:-94}"
RISK_SCORE="${PROOFPAY_RISK_SCORE:-12}"

cat <<EOF
Legacy deploy command shape:

casper-client put-deploy \\
  --node-address "$NODE_ADDRESS" \\
  --chain-name "$CHAIN_NAME" \\
  --secret-key "$SECRET_KEY" \\
  --payment-amount "$PAYMENT_AMOUNT" \\
  --session-path "$WASM_PATH" \\
  --session-arg "milestone_id:string='$MILESTONE_ID'" \\
  --session-arg "evidence_hash:string='$EVIDENCE_HASH'" \\
  --session-arg "decision:string='$DECISION'" \\
  --session-arg "decision_hash:string='$DECISION_HASH'" \\
  --session-arg "confidence:u64='$CONFIDENCE'" \\
  --session-arg "risk_score:u64='$RISK_SCORE'"

Newer transaction command shape:

casper-client put-transaction session \\
  --node-address "$NODE_ADDRESS" \\
  --chain-name "$CHAIN_NAME" \\
  --secret-key "$SECRET_KEY" \\
  --gas-price-tolerance "$GAS_PRICE_TOLERANCE" \\
  --pricing-mode fixed \\
  --transaction-path "$WASM_PATH" \\
  --session-entry-point call \\
  --category "install-upgrade" \\
  --session-arg "milestone_id:string='$MILESTONE_ID'" \\
  --session-arg "evidence_hash:string='$EVIDENCE_HASH'" \\
  --session-arg "decision:string='$DECISION'" \\
  --session-arg "decision_hash:string='$DECISION_HASH'" \\
  --session-arg "confidence:u64='$CONFIDENCE'" \\
  --session-arg "risk_score:u64='$RISK_SCORE'"

Before sending, confirm the installed CLI's exact argument grammar:

casper-client put-deploy --show-arg-examples
casper-client put-transaction session --help
EOF
