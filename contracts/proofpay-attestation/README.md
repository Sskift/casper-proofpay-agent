# ProofPay Attestation Contract

This package holds the Casper on-chain component required by the Casper Agentic Buildathon.

## Why It Exists

ProofPay Agent makes an autonomous milestone decision off-chain, then anchors the decision to Casper. The contract stores a compact attestation record keyed by milestone id:

- `milestone_id`
- `evidence_hash`
- `decision`
- `decision_hash`
- `confidence`
- `risk_score`

The app and `@proofpay/casper` package produce these same values before submitting the deploy.

## Odra Alignment

The buildathon page recommends Odra as the AI-discoverable Casper smart contract framework. `odra-module-sketch.rs` captures the intended Odra module shape for ProofPay:

- `attest(...)` stores a milestone attestation.
- `get(...)` reads a stored attestation.

The current executable fallback is raw Casper Rust in `src/main.rs`. This keeps a minimal Wasm deploy path available while the Odra CLI/tooling path is wired up. The fallback disables the `casper-contract` nightly-only default helpers and provides its own allocator/panic handler so it can build on the local stable Rust toolchain.

Primary references:

- https://odra.dev/docs/
- https://docs.rs/odra
- https://docs.casper.network/1.5.X/developers/writing-onchain-code/simple-contract
- https://docs.rs/casper-contract/latest

## Build

Install Rust and the `wasm32-unknown-unknown` target:

```bash
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
```

The optimized Wasm will be under:

```text
target/wasm32-unknown-unknown/release/proofpay_attestation.wasm
```

Verified locally:

```bash
cargo build --release --target wasm32-unknown-unknown
```

## Deploy Arguments

The session contract expects named args:

```text
milestone_id: String
evidence_hash: String
decision: String
decision_hash: String
confidence: u64
risk_score: u64
```

The named key written on-chain is:

```text
proofpay_attestation_<milestone_id>
```

## Submission Gate

Local demo hashes are not enough for DoraHacks eligibility. Before final submission, this contract must be deployed or invoked on Casper Testnet and the resulting deploy hash must be documented in `docs/casper-testnet.md` and the DoraHacks BUIDL submission.
