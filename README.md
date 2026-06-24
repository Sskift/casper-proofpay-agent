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
6. The dashboard shows the audit trail, local demo transaction hash, recorded Casper Testnet transaction, named key, stored URef, charts, evidence drilldowns, copy-ready deploy commands, and a portable Audit Dossier.

## Dashboard Cockpit

The web app has been refactored into a dense operator dashboard inspired by the local `money-run` cockpit:

- HeroUI cards, chips, tables, tabs, and link controls.
- Scroll-tracked sidebar navigation for the five judge sections.
- Recharts for cold-chain telemetry, escrow cashflow, and evidence coverage.
- Lightweight Charts for the agent risk tape.
- Scenario switcher for `approve`, `hold`, and `reject` judge flows.
- Evidence room with reviewer summary, document cards, claim cards, and timeline tabs.
- Action queue that turns agent findings into reviewer next steps.
- Casper proof workbench with transaction hash, named key, stored URef, deploy command, and readiness gate cards.
- Audit Dossier workbench that packages the decision trace, evidence hash, decision hash, Casper proof facts, CLI command, and reviewer checklist into a copy-ready JSON artifact.

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

The local dashboard shows deterministic demo transaction hashes for repeatable judge-mode flows. The `clean` scenario also includes a successful Casper Testnet transaction-producing component:

```text
transaction_hash: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
named_key: proofpay_attestation_ms-delivery-acceptance
stored_uref: uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```

Full Testnet evidence is documented in [docs/casper-testnet.md](docs/casper-testnet.md).

The dashboard's Audit Dossier section shows the same proof chain in a portable review package: policy trace, normalized evidence observations, evidence hash, decision hash, local demo transaction, Casper Testnet transaction, named key, stored URef, and reproduction checklist.

## Casper CLI Path

Casper does have CLI tooling for the hard part of this project:

- `casper-client` sends deploys/transactions, checks deploy status, queries global state, and can verify contracts.
- `cargo-casper` scaffolds Casper Wasm contract projects and tests.
- `odra-cli` is the optional path if the raw contract is migrated into a full Odra module with deploy scripts.

DoraHacks itself still appears to be a manual BUIDL website submission flow, not a CLI flow. The operational CLI notes are captured in [docs/casper-cli-runbook.md](docs/casper-cli-runbook.md).

## DoraHacks Submission Assets

Prepared in this repository:

- [docs/buidl-submission-brief.md](docs/buidl-submission-brief.md)
- [docs/submission-checklist.md](docs/submission-checklist.md)
- [docs/demo-script.md](docs/demo-script.md)
- [docs/demo/proofpay-agent-demo.mp4](docs/demo/proofpay-agent-demo.mp4)
- [docs/casper-testnet.md](docs/casper-testnet.md)
- [docs/casper-cli-runbook.md](docs/casper-cli-runbook.md)
- [docs/hackathon-constraints.md](docs/hackathon-constraints.md)

Public demo video URL for the DoraHacks BUIDL form:

```text
https://github.com/Sskift/casper-proofpay-agent/blob/main/docs/demo/proofpay-agent-demo.mp4
```

Before the real DoraHacks submission, run:

```bash
npm run submission:check
```

Manual submission still requires opening DoraHacks, accepting the organizer disclaimer, reviewing the generated BUIDL draft, and confirming the final submit action.

## Scripts

```bash
npm run test       # package unit tests
npm run typecheck  # TypeScript checks
npm run build      # Next.js production build
npm run dev        # local dashboard
npm run submission:check       # final repository cleanliness and submission asset check
npm run attestation:export     # print a scenario's Casper attestation payload
npm run casper:check           # verify Casper CLI, Testnet RPC, and local account status
npm run contract:build         # build Casper Wasm
npm run contract:deploy:print  # print Casper Testnet deploy command shapes
npm run contract:deploy:testnet # send or reproduce a Casper Testnet transaction
```

## Prototype Boundary

This hackathon prototype does not custody real funds. Escrow is represented as milestone state plus a Casper attestation record. Evidence data is synthetic and designed for repeatable judge-mode demos.
