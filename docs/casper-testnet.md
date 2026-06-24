# Casper Testnet Deployment Notes

This document tracks the path from local ProofPay attestation payloads to a real Casper Testnet transaction.

## Current Status

- Local deterministic demo transactions are implemented in `packages/casper`.
- Casper contract source is present in `contracts/proofpay-attestation`.
- The contract builds to Casper-compatible Wasm with `npm run contract:build`.
- The build path uses Rust plus Binaryen `wasm-opt` to remove Casper-incompatible bulk-memory instructions.
- A real Casper Testnet transaction has executed successfully for the `clean` judge scenario.
- CLI deployment steps are captured in `docs/casper-cli-runbook.md`.
- `casper-client 5.0.1` and `cargo-casper 3.0.0` are installed locally.
- Current verified `casper-client` node address: `https://node.testnet.casper.network`.

## Local Testnet Account

Generated outside the repository:

```text
key directory: ~/.casper/proofpay-testnet-20260623
public_key_hex: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
```

Current account state:

```text
named_key: proofpay_attestation_ms-delivery-acceptance
named_key_uref: uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
balance_after_successful_deploy: 62068777606 motes
```

## Funding Path

The user's CSPR.live Testnet wallet funded the local CLI deploy account.

```text
source_wallet_public_key: 0202674c1836d2504e6c8ebefe3711c0c19f27a96ac5b43cfcec6a2c9d6a15b2462c
source_wallet_account_hash: account-hash-6dba48834d42c2872bed07179850264a21c0e8267272bf6979c6fa0690314cf0
faucet_deploy_hash: dd7b7025903cf40d03cf8224355ccefda5e4934f8fbc9be4a2bd6ebf0f06bd06
wallet_to_cli_transfer_hash: 4c08848ff32deb0734ed524f7e7efcc35b07fa1c8a743fd2e649772baccc1f6e
wallet_to_cli_transfer_amount: 100 CSPR
```

## Successful Casper Testnet Transaction

```text
transaction_hash: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
block_hash: 30d1a199bb13ede3d22d6e96e3b01ef8153f203ca796ed251b3af1d2444da9e8
block_height: 8282603
initiator_public_key: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
initiator_account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
execution_error: null
payment_amount: 30000000000 motes
execution_consumed: 574963191
execution_refund: 22068777606
submitted_at: 2026-06-24T05:54:54.131Z
```

The transaction added this account named key:

```text
proofpay_attestation_ms-delivery-acceptance:
  uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```

The URef stores the attestation payload:

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1",
  "decision": "approve",
  "decision_hash": "0x9f691d379eef71639e776e80d1272a464f39848d1c39566d8dfb0c0beb68f74c",
  "confidence": 94,
  "risk_score": 12
}
```

## Verification Commands

Build the contract and verify it has no bulk-memory operations:

```bash
npm run contract:build
wasm2wat contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm \
  | rg "memory\\.init|data\\.drop|memory\\.copy|memory\\.fill|table\\.init|elem\\.drop|table\\.copy"
```

Query the transaction:

```bash
casper-client get-transaction \
  --node-address https://node.testnet.casper.network \
  94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
```

Query the stored attestation:

```bash
casper-client query-global-state \
  --node-address https://node.testnet.casper.network \
  --key uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```

Expected stored value:

```text
CLValue String:
{"milestone_id":"ms-delivery-acceptance","evidence_hash":"0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1","decision":"approve","decision_hash":"0x9f691d379eef71639e776e80d1272a464f39848d1c39566d8dfb0c0beb68f74c","confidence":94,"risk_score":12}
```

## Failed Attempt And Fix

An earlier transaction reached Testnet but failed execution:

```text
transaction_hash: ced413b02d54522bdd23e582f3c85c81841e53e7b4042f1439188911b94f87bf
block_height: 8282571
error: Wasm preprocessing error: Deserialization error: Bulk memory operations are not supported
```

Root cause:

- Rust's `wasm32-unknown-unknown` build still emitted `memory.copy`.
- Casper Testnet rejected the Wasm during preprocessing.

Fix:

- Build with `RUSTFLAGS="-C target-feature=-bulk-memory"`.
- Post-process with Binaryen:

```bash
wasm-opt proofpay_attestation.wasm \
  --llvm-memory-copy-fill-lowering \
  --strip-target-features \
  -Oz \
  -o proofpay_attestation.wasm
```

## DoraHacks Gate

The Casper Testnet transaction-producing component requirement is satisfied by:

```text
transaction_hash: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
named_key: proofpay_attestation_ms-delivery-acceptance
stored_uref: uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```
