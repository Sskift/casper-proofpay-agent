# Casper Testnet Deployment Notes

This document tracks the path from local ProofPay attestation payloads to a real Casper Testnet transaction.

## Current Status

- Local deterministic demo transactions are implemented in `packages/casper`.
- Casper contract source is present in `contracts/proofpay-attestation`.
- The contract builds locally to Wasm with `cargo build --release --target wasm32-unknown-unknown`.
- A real Casper Testnet deploy hash still needs to be produced before final DoraHacks submission.

## Prerequisites

- Rust toolchain.
- `wasm32-unknown-unknown` target.
- Casper CLI or equivalent Casper SDK deploy tooling.
- Funded Casper Testnet account.

## Build Contract

```bash
cd contracts/proofpay-attestation
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
```

Expected Wasm:

```text
target/wasm32-unknown-unknown/release/proofpay_attestation.wasm
```

## Deploy Arguments

Use values produced by the dashboard proof panel:

```text
milestone_id
evidence_hash
decision
decision_hash
confidence
risk_score
```

## Casper Testnet Command Shape

Use Casper CLI or SDK tooling to send the Wasm deploy with named args. The exact command depends on the installed Casper tooling version, but the deploy must include:

```text
chain-name: casper-test
payment amount: sufficient testnet CSPR
session wasm: proofpay_attestation.wasm
named args:
  milestone_id: "ms-delivery-acceptance"
  evidence_hash: "0x..."
  decision: "approve"
  decision_hash: "0x..."
  confidence: 94
  risk_score: 12
```

## Record After Deployment

After a successful deploy, update this document with:

```text
Deploy hash:
Account:
Contract package/hash or named key:
Explorer URL:
Scenario:
Evidence hash:
Decision hash:
Timestamp:
```

## DoraHacks Gate

The project is not fully submission-ready until this document contains a real Casper Testnet deploy hash, or clearly documents that the only remaining blocker is external testnet account funding or tooling access.
