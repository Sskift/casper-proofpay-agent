# Casper CLI Runbook

Last reviewed: 2026-06-23

This runbook captures the command-line path for turning ProofPay Agent from a local prototype into a Casper Testnet submission artifact.

## What Has A CLI

Casper has an official Rust CLI path:

- `cargo-casper`: creates Casper Wasm smart contract projects and tests.
- `casper-client`: sends transactions, deploys Wasm, queries global state, checks deploy status, and verifies contracts.
- `odra-cli`: useful if the project migrates from the raw Casper Rust fallback contract to a full Odra module and deploy script.

DoraHacks submission is still a website flow. I did not find an official DoraHacks BUIDL submission CLI in the public docs or website search results, so the final BUIDL form, organizer disclaimer, project copy, repo link, and demo video link remain manual.

## Install CLI Tools

```bash
cargo install casper-client
cargo install cargo-casper
```

Optional if migrating the contract to Odra:

```bash
cargo install odra-cli
```

Check local availability:

```bash
casper-client --version
cargo-casper --version
odra --version
```

At the time this document was added, these CLIs were not installed in the local shell environment.

## Build ProofPay Contract

From the repository root:

```bash
npm run contract:build
```

Expected Wasm:

```text
contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm
```

## Prepare Testnet Account

Before a real deploy:

- Create or import a Casper Testnet key pair.
- Fund the account from the Casper Testnet faucet.
- Pick a working Testnet node RPC URL.
- Keep the secret key path outside git.

Suggested local environment variables:

```bash
export CASPER_NODE_ADDRESS="http://65.21.235.219:7777"
export CASPER_SECRET_KEY="$HOME/.casper/keys/proofpay/secret_key.pem"
export CASPER_CHAIN_NAME="casper-test"
export CASPER_PAYMENT_AMOUNT="30000000000"
```

## Print A Deploy Command

The dashboard proof panel emits the values required by the contract. Feed them into the helper script:

```bash
PROOFPAY_MILESTONE_ID="ms-delivery-acceptance" \
PROOFPAY_EVIDENCE_HASH="0x..." \
PROOFPAY_DECISION="approve" \
PROOFPAY_DECISION_HASH="0x..." \
PROOFPAY_CONFIDENCE="94" \
PROOFPAY_RISK_SCORE="12" \
npm run contract:deploy:print
```

The script prints both command families currently visible in Casper docs:

- `put-deploy`, which is still used throughout the quickstart and contract-calling docs.
- `put-transaction session`, which appears in the newer installing-contracts docs.

Run `casper-client put-deploy --show-arg-examples` and `casper-client put-transaction session --help` after installing the CLI to confirm the exact argument grammar supported by the installed version.

## After Sending The Transaction

Record the deploy hash immediately:

```bash
casper-client get-deploy \
  --node-address "$CASPER_NODE_ADDRESS" \
  "[DEPLOY_HASH]"
```

Then update `docs/casper-testnet.md` with:

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

## Why This Matters

The DoraHacks repository link and local demo are not enough by themselves. The Casper Agentic Buildathon technical gate asks for a working prototype deployed on Casper Testnet with a transaction-producing on-chain component. This runbook is the operational path to satisfy that gate.

## Source Notes

- Casper prerequisites document `cargo install cargo-casper` and `cargo install casper-client`: https://docs.casper.network/next/developers/prerequisites
- Casper installing-contracts docs show the `put-transaction session` contract install shape: https://docs.casper.network/developers/cli/installing-contracts
- Casper quickstart and calling-contracts docs still show `put-deploy` for install and contract calls: https://docs.casper.network/resources/quick-start and https://docs.casper.network/developers/cli/calling-contracts
- Odra CLI docs describe deploy scripts and stored deployed contract resources: https://odra.dev/docs/tutorials/odra-cli/
- DoraHacks BUIDL submission appears to remain a website flow: https://dorahacks.io/blog/guides/how-to-submit-a-buidl
