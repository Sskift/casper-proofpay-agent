# Casper Testnet Deployment Notes

This document tracks the path from local ProofPay attestation payloads to a real Casper Testnet transaction.

## Current Status

- Local deterministic demo transactions are implemented in `packages/casper`.
- Casper contract source is present in `contracts/proofpay-attestation`.
- The contract builds locally to Wasm with `cargo build --release --target wasm32-unknown-unknown`.
- A real Casper Testnet deploy hash still needs to be produced before final DoraHacks submission.
- CLI deployment steps are captured in `docs/casper-cli-runbook.md`.
- `casper-client 5.0.1` and `cargo-casper 3.0.0` are installed locally.
- Current verified `casper-client` node address: `https://node.testnet.casper.network`.
- The generated CLI Testnet account does not exist on-chain until funded by faucet.

## Local Testnet Account

Generated outside the repository:

```text
key directory: ~/.casper/proofpay-testnet-20260623
public_key_hex: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
```

Latest query before faucet funding:

```text
state_get_account_info: No such account
```

Faucet URL:

```text
https://testnet.cspr.live/tools/faucet
```

The faucet requires a connected Casper wallet and reCAPTCHA. For CLI deployment, the funded account must match `CASPER_SECRET_KEY`.

## Prerequisites

- Rust toolchain.
- `wasm32-unknown-unknown` target.
- Casper CLI or equivalent Casper SDK deploy tooling.
- Funded Casper Testnet account.

## Build Contract

```bash
npm run contract:build
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

Use Casper CLI or SDK tooling to send the Wasm deploy with named args. `docs/casper-cli-runbook.md` documents the `casper-client` command shapes. The exact command depends on the installed Casper tooling version, but the deploy must include:

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
