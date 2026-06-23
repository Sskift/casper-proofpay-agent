# ProofPay Agent Design

Date: 2026-06-23
Hackathon: Casper Agentic Buildathon 2026 - Qualification Round
Project path: `/Users/bytedance/Desktop/test/casper-proofpay-agent`
Repository: `Sskift/casper-proofpay-agent`

## Goal

ProofPay Agent is a hackathon-ready product that demonstrates autonomous milestone escrow for real-world assets. A buyer creates a funded milestone for an invoice, shipment, or delivery obligation. A supplier submits evidence. An AI agent evaluates the evidence, explains its decision, assigns a confidence and risk score, and anchors the attestation to Casper testnet.

The product should feel like a credible financial workflow, not a toy chatbot. The winning story is:

- Agentic AI makes a bounded payment recommendation.
- Casper records the milestone, evidence hash, attestation, and payout decision.
- RWA and DeFi are connected through milestone-based escrow for real-world delivery.
- Judges can run a seeded demo quickly, inspect the reasoning, and see the on-chain proof path.

## Hackathon Fit

The Casper requirements observed on DoraHacks are:

- Working prototype deployed on Casper Testnet with a transaction-producing on-chain component.
- Open-source GitHub repository with README and usage instructions.
- Demo video explaining the project, features, and walkthrough.
- Focus on Agentic AI applications, especially DeFi and RWA on Casper.

ProofPay Agent will satisfy these by shipping:

- A usable local web app with a judge-friendly seeded demo mode.
- A Casper smart contract package for milestone and attestation records.
- A transaction adapter that can run in demo mode and testnet mode.
- README, architecture notes, judging criteria mapping, and demo video script.

## Primary User Journey

1. Buyer opens the dashboard and reviews an active RWA deal.
2. Buyer creates or selects a milestone, such as "Release payment after invoice and delivery proof match."
3. Supplier submits evidence. For the hackathon demo, seeded evidence includes invoice, bill of lading, delivery note, and anomaly cases.
4. ProofPay Agent extracts the key claims, checks consistency, scores risk, and recommends approve, hold, or reject.
5. The app hashes the evidence bundle and records an attestation transaction through the Casper adapter.
6. The dashboard shows the transaction hash, decision, score, evidence hash, and audit trail.
7. Judge mode can replay the full flow without external accounts, then switch to testnet configuration when keys and faucet funds are available.

## Product Surface

### Dashboard

The dashboard shows active deals, milestone states, escrow amount, risk level, agent decision, and Casper attestation status. It should look like an operational finance tool: dense, scannable, and credible.

### Evidence Review

Evidence review shows submitted documents, extracted claims, consistency checks, and the agent reasoning chain. The UI should not expose raw prompt mechanics. It should present a structured audit report with confidence, risk flags, and recommended action.

### On-Chain Proof Panel

The proof panel shows:

- Casper network mode: local demo or testnet.
- Contract package or mock contract reference.
- Transaction hash or local simulated hash.
- Evidence bundle hash.
- Milestone id.
- Agent attestation id.
- Decision enum: approve, hold, reject.

### Judge Mode

Judge mode provides one-click seeded flows:

- Clean approval: invoice and delivery evidence match.
- Hold for review: amount mismatch or missing delivery confirmation.
- Reject: suspicious vendor identity or duplicate invoice fingerprint.

Each flow should finish in under two minutes and produce an audit artifact.

## Architecture

The repository will use a TypeScript monorepo-style layout:

- `apps/web`: frontend and local API routes.
- `packages/agent`: evidence analysis, scoring, and decision policy.
- `packages/casper`: Casper transaction adapter, local simulator, and contract interface.
- `contracts/proofpay-attestation`: smart contract source and deployment notes.
- `docs`: architecture, demo script, screenshots, and submission checklist.

The frontend will use Next.js with React, TypeScript, and npm workspaces. The app must run locally with a single command and include seeded data.

## Data Model

Core entities:

- `Deal`: buyer, supplier, asset type, escrow amount, currency, jurisdiction, milestones.
- `Milestone`: id, description, amount, due date, state, evidence requirements.
- `EvidenceBundle`: document metadata, extracted claims, hashes, source type, submitted timestamp.
- `AgentAssessment`: decision, confidence, risk score, reasons, flags, required follow-up.
- `CasperAttestation`: milestone id, evidence hash, decision hash, transaction hash, network, timestamp.

The local app can persist seeded records in JSON or lightweight local storage. No production database is required for the hackathon version.

## Agent Design

The agent is a deterministic policy engine wrapped around AI-style evidence interpretation. For hackathon reliability, the core scoring must work offline with seeded evidence. Optional LLM integration can be added through an environment variable, but the demo must not depend on a paid API key.

Agent outputs:

- Extracted claim table.
- Consistency checks.
- Risk flags.
- Final decision: approve, hold, reject.
- Confidence from 0 to 100.
- Human-readable explanation.
- Hashable attestation payload.

The agent must be transparent enough for judges to trust the result, while still showing autonomy: it makes the recommendation and triggers the Casper attestation step.

## Casper Integration

The Casper layer has two modes:

### Demo Mode

Demo mode simulates transaction production locally and returns deterministic transaction-like hashes. This keeps the product usable without testnet funds and is clearly labeled as local demo mode.

### Testnet Mode

Testnet mode uses a generated or user-provided Casper key and a funded testnet account. The contract records milestone attestations with:

- milestone id
- evidence hash
- decision
- confidence
- risk score
- assessor public key or agent id
- timestamp

The implementation target is a real Casper testnet transaction before submission. If the only blocker is external testnet funding or account setup, the repository will still include contract code, transaction adapter boundaries, demo-mode transaction production, and exact deployment instructions; however, the project is not considered fully submission-ready until the testnet transaction path has either succeeded or the blocker is documented.

## Error Handling

- Missing evidence: mark milestone as hold and explain the missing requirement.
- Contradictory evidence: mark hold with the conflicting fields.
- High-risk evidence: reject only when a clear fraud signal is present.
- Casper transaction failure: keep the assessment locally, show retry action, and preserve the attestation payload.
- No testnet configuration: stay in demo mode and show the steps required to enable testnet.

## Security And Trust

The product does not custody real funds in the hackathon prototype. Escrow is represented as milestone state and attestation records. The README must clearly state the prototype boundary.

Evidence hashes will be computed from normalized demo evidence. The app will avoid storing private documents by default; seeded evidence is synthetic.

## Testing And Verification

Required checks:

- Unit tests for evidence scoring and decision policy.
- Unit tests for evidence hash and attestation payload creation.
- UI smoke test for the judge-mode happy path.
- Build or typecheck.
- Manual browser verification of desktop and mobile layouts.
- README run-through from a fresh checkout.

## Submission Assets

The repository should include:

- `README.md` with setup, architecture, demo flow, and Casper mapping.
- `docs/demo-script.md` for a 2 to 3 minute video.
- `docs/submission-checklist.md` mapped to DoraHacks requirements.
- Screenshots after visual verification.
- Optional `docs/casper-testnet.md` for key, faucet, deploy, and transaction steps.

## Success Criteria

The project is ready for submission when:

- The app starts locally from the documented command.
- Judge mode demonstrates at least three assessment outcomes.
- Each assessment creates an evidence hash and Casper attestation payload.
- The Casper adapter can run in demo mode and has a documented testnet path.
- A real Casper testnet transaction is completed, or the remaining external blocker is documented with a reproducible deployment path.
- Tests and build pass.
- The public GitHub repository contains all required documentation.
