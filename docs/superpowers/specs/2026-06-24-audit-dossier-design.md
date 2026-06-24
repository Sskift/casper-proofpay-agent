# Audit Dossier Design

## Goal

Add an audit-grade evidence dossier to ProofPay Agent so judges can inspect, copy, and verify the complete payment decision package from one place.

## Problem

ProofPay already demonstrates the core RWA escrow flow: agent assessment, evidence review, Casper payload, and Testnet proof. The next credibility gap is traceability. A judge can see the decision, but must mentally connect the evidence claims, policy checks, hashes, CLI deploy arguments, and Casper proof across several panels and repository files.

The Audit Dossier turns those signals into a single review artifact.

## Product Shape

The dashboard adds a fifth section, `Dossier`, after `Casper`. The sidebar becomes:

1. Cockpit
2. Charts
3. Evidence
4. Casper
5. Dossier

The Dossier section is a judge-facing workbench with:

- A one-screen decision summary: project scenario, release decision, confidence, risk score, and follow-up status.
- A verification chain: evidence hash, decision hash, local demo transaction hash, Casper Testnet transaction hash, named key, stored URef, and block height when available.
- A reasoning trace: each policy check, expected value, observed value, status, and impact on the decision.
- A portable JSON audit package with the same fields, rendered in the UI and copyable from a `pre` block.
- A human-readable checklist that explains how a reviewer can reproduce the evidence from the repository.

## Data Model

The agent package owns a new dossier model because this is domain logic, not view glue.

New exported interfaces:

- `AuditTraceStep`: a single policy check with `id`, `label`, `expected`, `observed`, `status`, `impact`, and `sources`.
- `AuditDossier`: a portable object with `id`, `scenario`, `decision`, `confidence`, `riskScore`, `policyVersion`, `releaseAmount`, `verification`, `trace`, `reviewChecklist`, and `generatedAt`.

New exported function:

```ts
createAuditDossier(input: CreateAuditDossierInput): AuditDossier
```

`CreateAuditDossierInput` receives the deal, milestone, bundle, assessment, evidence hash, decision hash, optional Casper deployment facts, optional local demo transaction hash, and CLI command. The function is deterministic except for `generatedAt`, which is derived from `assessment.assessedAt` so tests and demos stay stable.

## Reasoning Trace

The trace mirrors the real assessment policy instead of inventing a separate explanation layer. It includes these checks:

- Invoice amount
- Settlement currency
- Shipment identity
- Delivery confirmation
- Temperature band
- Counterparty registry
- Duplicate invoice
- Casper attestation readiness

Each step is marked:

- `passed`: evidence supports automatic release.
- `warning`: evidence needs human review.
- `failed`: evidence blocks release.
- `pending`: Casper proof is not recorded for the selected non-clean scenario.

This keeps clean, hold, and reject scenarios understandable without adding fake model output.

## Frontend

`apps/web/src/app/page.tsx` adds a `DossierSection` component. It follows the existing dashboard style:

- No nested page cards.
- Dense operator layout, not a marketing hero.
- Stable responsive grid dimensions.
- Tables/cards only for repeated evidence items.
- Existing `Chip`, `Card`, `Link`, and icon patterns.

The Dossier section receives `deal`, `milestone`, `bundle`, `assessment`, `payload`, `deployPlan`, `transaction`, and `dossier`. It shows:

- Dossier summary cards.
- Trace cards grouped in a responsive grid.
- Verification facts with copy-friendly monospace values.
- JSON package panel.
- Reviewer checklist.

## Testing

Agent package tests cover:

- Clean scenario dossier includes an approve decision, release amount, Casper Testnet transaction hash, named key, stored URef, and all passed core checks.
- Amount mismatch dossier includes a failed invoice amount check and manual finance follow-up.
- Duplicate invoice dossier includes a failed duplicate check and reject decision.
- Dossier JSON remains deterministic for the same input.

Web layout smoke test extends the existing dashboard layout checker to require the `dossier` section and sidebar item.

## Docs And Submission Impact

README and the DoraHacks submission brief mention the Audit Dossier as the new judge-facing verification artifact. The existing DoraHacks submission does not need to be recreated because the repository URL is unchanged; judges will see the latest pushed `main`.

## Out Of Scope

- Real wallet signing from the browser.
- Calling Casper RPC from the client at runtime.
- Uploading a new demo video immediately.
- Replacing the existing Evidence or Casper sections.

Those can be later final-round polish, but the current goal is to deepen auditability without destabilizing the submitted BUIDL.
