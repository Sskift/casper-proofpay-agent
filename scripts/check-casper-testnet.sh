#!/usr/bin/env bash
set -euo pipefail

NODE_ADDRESS="${CASPER_NODE_ADDRESS:-https://node.testnet.casper.network}"
KEY_DIR="${CASPER_KEY_DIR:-$HOME/.casper/proofpay-testnet-20260623}"
PUBLIC_KEY_FILE="${CASPER_PUBLIC_KEY_FILE:-$KEY_DIR/public_key_hex}"

if ! command -v casper-client >/dev/null 2>&1; then
  echo "casper-client is not installed. Run: cargo install casper-client"
  exit 1
fi

echo "Casper client:"
casper-client --version
echo

echo "Testnet state root from $NODE_ADDRESS:"
casper-client get-state-root-hash --node-address "$NODE_ADDRESS"
echo

if [ ! -f "$PUBLIC_KEY_FILE" ]; then
  echo "No public key found at $PUBLIC_KEY_FILE"
  echo "Generate one with: casper-client keygen \"$KEY_DIR\""
  exit 1
fi

PUBLIC_KEY_HEX="$(cat "$PUBLIC_KEY_FILE")"
ACCOUNT_HASH="$(casper-client account-address --public-key "$PUBLIC_KEY_FILE")"

echo "ProofPay Testnet account:"
echo "public_key_hex=$PUBLIC_KEY_HEX"
echo "account_hash=$ACCOUNT_HASH"
echo

echo "Account status:"
if casper-client get-account --node-address "$NODE_ADDRESS" --account-identifier "$PUBLIC_KEY_FILE"; then
  echo
  echo "Balance:"
  casper-client query-balance --node-address "$NODE_ADDRESS" --purse-identifier "$PUBLIC_KEY_FILE"
else
  echo
  echo "The account does not exist on Testnet yet. Fund the same public key from:"
  echo "https://testnet.cspr.live/tools/faucet"
  echo
  echo "CSPR.live faucet requires a connected Casper wallet and reCAPTCHA."
  echo "For CLI deployment, CASPER_SECRET_KEY must point to the funded account's secret_key.pem."
fi
