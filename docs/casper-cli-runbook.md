# Casper CLI Runbook

Last reviewed: 2026-06-24

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
brew install binaryen wabt
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

Current local checkpoint:

```text
casper-client 5.0.1
cargo-casper 3.0.0
wasm-opt available through Binaryen
wasm2wat available through WABT
```

Use this Testnet node address with `casper-client`:

```bash
export CASPER_NODE_ADDRESS="https://node.testnet.casper.network"
```

Do not include `/rpc` in `CASPER_NODE_ADDRESS` when using `casper-client`; the client appends the RPC path itself. For raw `curl` calls, use `https://node.testnet.casper.network/rpc`.

## Build ProofPay Contract

From the repository root:

```bash
npm run contract:build
```

The build script compiles the Rust contract with bulk memory disabled, then lowers any remaining `memory.copy` / `memory.fill` instructions with Binaryen:

```bash
RUSTFLAGS="-C target-feature=-bulk-memory"
wasm-opt --llvm-memory-copy-fill-lowering --strip-target-features -Oz
```

Install Binaryen before building if `wasm-opt` is unavailable:

```bash
brew install binaryen
```

Casper Testnet currently rejects Wasm modules containing bulk-memory operations. If WABT's `wasm2wat` is installed, the build script also checks the final artifact and fails when these operations remain.

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
export CASPER_NODE_ADDRESS="https://node.testnet.casper.network"
export CASPER_SECRET_KEY="$HOME/.casper/keys/proofpay/secret_key.pem"
export CASPER_CHAIN_NAME="casper-test"
export CASPER_PAYMENT_AMOUNT="30000000000"
```

Check the account and node:

```bash
npm run casper:check
```

The CSPR.live faucet requires a connected Casper wallet and Google reCAPTCHA. The faucet request is not a simple unauthenticated CLI call.

## Print A Deploy Command

The dashboard proof panel emits the values required by the contract. The same payload can be exported from the repo:

```bash
npm run attestation:export -- clean
npm run attestation:export -- --env clean
npm run contract:deploy:print
```

The script prints both command families currently visible in Casper docs:

- `put-deploy`, which is still used throughout the quickstart and contract-calling docs.
- `put-transaction session`, which appears in the newer installing-contracts docs.

Run `casper-client put-deploy --show-arg-examples` and `casper-client put-transaction session --show-simple-arg-examples` after installing the CLI to confirm the exact argument grammar supported by the installed version.

## Deploy Or Reproduce

Once `npm run casper:check` shows the funded account exists, deploy the contract:

```bash
PROOFPAY_SCENARIO="clean" npm run contract:deploy:testnet
```

The script builds from the same attestation payload used by the dashboard and sends:

```bash
casper-client put-transaction session \
  --node-address "$CASPER_NODE_ADDRESS" \
  --chain-name "casper-test" \
  --secret-key "$CASPER_SECRET_KEY" \
  --wasm-path "contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm" \
  --payment-amount "$CASPER_PAYMENT_AMOUNT" \
  --standard-payment true \
  --gas-price-tolerance "1" \
  --install-upgrade \
  --session-entry-point call \
  --session-arg "milestone_id:string='ms-delivery-acceptance'" \
  --session-arg "evidence_hash:string='0x...'" \
  --session-arg "decision:string='approve'" \
  --session-arg "decision_hash:string='0x...'" \
  --session-arg "confidence:u64='94'" \
  --session-arg "risk_score:u64='12'"
```

## After Sending The Transaction

Record the transaction hash immediately:

```bash
casper-client get-transaction \
  --node-address "$CASPER_NODE_ADDRESS" \
  "[TRANSACTION_HASH]"
```

Then query the stored attestation URef from the account named key:

```bash
casper-client query-global-state \
  --node-address "$CASPER_NODE_ADDRESS" \
  --key "[STORED_UREF]"
```

The clean scenario has already been executed on Casper Testnet:

```text
transaction_hash: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
named_key: proofpay_attestation_ms-delivery-acceptance
stored_uref: uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```

## Why This Matters

The DoraHacks repository link and local demo are not enough by themselves. The Casper Agentic Buildathon technical gate asks for a working prototype deployed on Casper Testnet with a transaction-producing on-chain component. This runbook is the operational path to satisfy that gate.

## Source Notes

- Casper prerequisites document `cargo install cargo-casper` and `cargo install casper-client`: https://docs.casper.network/next/developers/prerequisites
- Casper installing-contracts docs show the `put-transaction session` contract install shape: https://docs.casper.network/developers/cli/installing-contracts
- Casper quickstart and calling-contracts docs still show `put-deploy` for install and contract calls: https://docs.casper.network/resources/quick-start and https://docs.casper.network/developers/cli/calling-contracts
- Odra CLI docs describe deploy scripts and stored deployed contract resources: https://odra.dev/docs/tutorials/odra-cli/
- DoraHacks BUIDL submission appears to remain a website flow: https://dorahacks.io/blog/guides/how-to-submit-a-buidl
