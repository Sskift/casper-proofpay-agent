# ProofPay Agent

ProofPay Agent is an agentic RWA milestone escrow prototype for the Casper Agentic Buildathon. It reviews real-world delivery evidence, makes a bounded payment recommendation, hashes the evidence bundle, and prepares a Casper attestation payload for on-chain anchoring.

The product is built for the Casper Innovation Track: Agentic AI, DeFi, and Real-World Assets.

## Buildathon Constraints

The project constraints are captured in [docs/hackathon-constraints.md](docs/hackathon-constraints.md).

Key gates:

- Final submission happens through DoraHacks `Submit BUIDL`.
- Public GitHub/GitLab/Bitbucket repository is required.
- Public demo video is required.
- Casper Testnet deployment with a transaction-producing on-chain component is required.
- Working smart contracts on Casper Testnet are part of judging.
- CSPR.fans community voting can advance the top 3 projects directly to the final round.

## What It Does

ProofPay simulates a buyer/supplier RWA escrow workflow:

1. A buyer funds a milestone for a temperature-controlled vaccine shipment.
2. A supplier submits invoice, bill of lading, delivery note, temperature log, and registry evidence.
3. The agent extracts claims, checks consistency, scores risk, and chooses `approve`, `hold`, or `reject`.
4. The app creates an evidence hash and decision hash.
5. The Casper adapter creates an attestation payload for the on-chain contract.
6. The dashboard shows the audit trail, local demo transaction hash, and Casper Testnet readiness status.

## Repository Layout

```text
apps/web                      Next.js dashboard
packages/agent                Evidence model, seeded RWA data, scoring policy, hashes
packages/casper               Attestation payloads and local demo transaction adapter
contracts/proofpay-attestation Casper/Odra contract materials
docs                          Submission, demo, and testnet documentation
```

## Quick Start

```bash
npm install
npm run test
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

## Judge Mode Scenarios

- Clean release: all evidence aligns and the agent recommends release.
- Hold for finance: shipment evidence is credible, but invoice amount exceeds the milestone.
- Reject duplicate: invoice fingerprint matches a previously settled attestation.

## Casper Contract Path

The contract package is in [contracts/proofpay-attestation](contracts/proofpay-attestation).

Current structure:

- `src/main.rs`: raw Casper Rust fallback with `#![no_std]`, `#![no_main]`, and `call()`.
- `odra-module-sketch.rs`: Odra-style module sketch for the intended framework migration.
- `README.md`: build and deploy argument reference.

The local dashboard shows deterministic demo transaction hashes while development is in progress. These local hashes are not enough for DoraHacks eligibility. The final submission must include a Casper Testnet deploy hash, documented in [docs/casper-testnet.md](docs/casper-testnet.md).

## Casper CLI Path

Casper does have CLI tooling for the hard part of this project:

- `casper-client` sends deploys/transactions, checks deploy status, queries global state, and can verify contracts.
- `cargo-casper` scaffolds Casper Wasm contract projects and tests.
- `odra-cli` is the optional path if the raw contract is migrated into a full Odra module with deploy scripts.

DoraHacks itself still appears to be a manual BUIDL website submission flow, not a CLI flow. The operational CLI notes are captured in [docs/casper-cli-runbook.md](docs/casper-cli-runbook.md).

## DoraHacks Submission Assets

Prepared in this repository:

- [docs/submission-checklist.md](docs/submission-checklist.md)
- [docs/demo-script.md](docs/demo-script.md)
- [docs/casper-testnet.md](docs/casper-testnet.md)
- [docs/casper-cli-runbook.md](docs/casper-cli-runbook.md)
- [docs/hackathon-constraints.md](docs/hackathon-constraints.md)

Manual submission still requires the user to open DoraHacks, accept the organizer disclaimer, and submit the BUIDL form.

## Scripts

```bash
npm run test       # package unit tests
npm run typecheck  # TypeScript checks
npm run build      # Next.js production build
npm run dev        # local dashboard
npm run contract:build         # build Casper Wasm
npm run contract:deploy:print  # print Casper Testnet deploy command shapes
```

## Prototype Boundary

This hackathon prototype does not custody real funds. Escrow is represented as milestone state plus a Casper attestation record. Evidence data is synthetic and designed for repeatable judge-mode demos.
