# Product Depth Iteration Design

## Goal

Move ProofPay Agent from a polished judge dashboard toward a more complete Casper-native product demo without recording a new video yet.

## Scope

This iteration adds product depth in four areas:

1. Evidence Intake: a reviewer can see sample evidence packs, document extraction, confidence, and provenance before the agent decision.
2. Role Workflow: buyer, supplier, and arbiter responsibilities are visible as a compact workflow, not hidden in prose.
3. Agent Evaluation: seeded scenario coverage is shown as a small evaluation matrix across approve, hold, and reject outcomes.
4. Ecosystem Hooks: the app exposes lightweight API routes for attestation retrieval, MCP-style tool discovery, and an x402-ready release decision handshake.

The UI should remain dense but readable. Long JSON, command lines, and protocol details belong in secondary tabs or API/docs links. The primary dashboard should show decisions, state transitions, and verification facts through cards, meters, flow nodes, and concise copy.

## Non-Goals

- No new demo video in this iteration.
- No fake Testnet deployment records for hold or reject scenarios.
- No production auth, database, wallet custody, or real payment settlement.
- No generic chatbot unless it directly improves auditability.

## Feature Design

### Evidence Intake

Add an intake view that shows each evidence document as an ingest card with type, source, extraction confidence, normalized claim, fingerprint, and status. It should look like an operator console, not a file upload marketing mock. Because the demo is seeded, the control should switch between seeded evidence packs rather than accepting arbitrary real files.

### Role Workflow

Add role cards for Supplier, ProofPay Agent, Buyer, Arbiter, and Casper. Each card should show the active responsibility, SLA/status, and the next action. This gives the product a real-world workflow loop instead of only showing AI output.

### Agent Evaluation

Add an evaluation matrix derived from the seeded scenarios. Each row should show expected decision, actual decision, risk, confidence, and whether the policy gate passed. This is a compact trust story for judges.

### Ecosystem Hooks

Add local API routes:

- `GET /api/attestation/[scenario]`: returns the scenario payload, assessment, deploy plan, verification summary, and audit dossier.
- `GET /api/mcp`: returns a small MCP-style tool manifest for `assess_milestone_evidence` and `get_casper_attestation`.
- `POST /api/x402/release-decision`: returns HTTP 402 with payment metadata unless the request includes `x-proofpay-demo-paid: true`; when present, it returns the release decision package.

These routes are not a full MCP server or real x402 settlement. They are honest, runnable integration hooks that show how ProofPay would plug into Casper agent ecosystems.

### Casper Deployment

Attempt to deploy hold and reject scenarios only if the local funded Testnet account and CLI are ready. If deployment cannot be completed safely, update docs/UI to show a deploy queue with exact commands and no fabricated hashes.

## Verification

- Add tests for intake model, workflow model, and evaluation matrix.
- Add route tests or source-contract checks for the API routes.
- Extend dashboard layout checks for the new workbench sections.
- Run `npm run test`, `npm run typecheck`, `npm run build`, and `npm run submission:check`.
- Run a visual check for desktop and mobile after UI changes.
