# ProofPay Agent Demo Script

Target length: 90 to 110 seconds.

The submitted demo video uses AI text-to-speech narration with burned-in captions. The video file lives at `docs/demo/proofpay-agent-demo.mp4` so the DoraHacks BUIDL link can keep pointing at the same GitHub path after updates.

## Scene 1: Cockpit

ProofPay Agent is an agentic milestone escrow cockpit for real-world asset payments on Casper. It verifies delivery evidence before an escrow release can move forward.

Show:

- Release readiness, risk, confidence, evidence coverage, and Casper anchor metrics.
- Reviewer action queue.
- Left navigation with the active Cockpit section.

## Scene 2: Charts

In the clean release scenario, the invoice, bill of lading, delivery note, vendor registry, and cold-chain telemetry all align. The agent recommends release with high confidence.

Show:

- Risk tape.
- Cold-chain telemetry.
- Escrow cashflow and evidence coverage charts.

## Scene 3: Evidence

The Evidence room keeps the decision explainable. Reviewers can inspect the source documents, extracted claims, and event timeline instead of trusting a black box.

Show:

- Clean release decision and confidence.
- Document status, claim extraction, and timeline tabs.

## Scene 4: Casper

The Casper panel exposes the real Testnet transaction, block height, named key, stored URef, public key, and the deploy command used for the attestation.

Mention:

- Successful Casper Testnet transaction `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`.
- Stored URef `uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007`.
- Contract and deploy details are documented in `docs/casper-testnet.md`.

## Scene 5: Audit Dossier

New in this iteration is the Audit Dossier. Every policy check becomes a trace card with expected value, observed value, status, impact, and evidence source.

Show:

- Passed trace cards for invoice amount, settlement currency, shipment identity, delivery confirmation, temperature band, and counterparty registry.
- Verification chain with evidence hash, decision hash, local demo transaction, Casper Testnet transaction, and stored URef.
- Copy-ready JSON audit package.

## Scene 6: Hold Path

When the invoice amount is too high, ProofPay changes the decision to human review. The dossier marks invoice amount as failed and asks buyer finance to resolve the mismatch.

Show:

- `Hold for finance` scenario.
- Failed invoice amount trace.
- Human review decision.

## Scene 7: Reject Path

When the invoice fingerprint is duplicated, ProofPay blocks release and escalates the payment to fraud review. The failed trace stays visible in the same dossier format.

Show:

- `Reject duplicate` scenario.
- Blocked cockpit state.
- Fraud review escalation.

## Closing

ProofPay combines agentic evidence review, decentralized escrow operations, and Casper attestations. AI does the evidence work, while Casper makes the final payment decision auditable.
