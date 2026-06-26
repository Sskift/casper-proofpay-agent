# ProofPay Agent Demo Script

Target length: 115 to 120 seconds.

The submitted demo video is a 1080p dynamic browser walkthrough with Coze AI text-to-speech narration, visible cursor movement, section navigation, page scrolling, chart hover states, tab switching, scenario switching, and compact lower-third captions. The video file lives at `docs/demo/proofpay-agent-demo.mp4` so the DoraHacks BUIDL link can keep pointing at the same GitHub path after updates.

The exact narration source for the current video lives at `docs/demo/proofpay-agent-demo-narration.txt`.

For recording setup, voiceover handling, ffmpeg commands, quality review, and cleanup rules, use `docs/demo-recording-workflow.md`.

## Scene 1: Cockpit

ProofPay Agent is an agentic milestone escrow cockpit for real-world asset payments on Casper. It verifies delivery evidence before an escrow release can move forward.

Show:

- Judge walkthrough control with Cockpit, Trust, Evidence, Casper, and Dossier.
- Release readiness, risk, confidence, evidence coverage, and Casper anchor metrics.
- Confidence, risk health, and evidence radial gauges.
- Reviewer action queue.
- Left navigation with the active Cockpit section.

## Scene 2: Charts

In the clean release scenario, the invoice, bill of lading, delivery note, vendor registry, and cold-chain telemetry all align. The agent recommends release with high confidence.

Show:

- Risk tape.
- Cold-chain telemetry.
- Escrow cashflow and evidence coverage charts.
- All four charts visible as a chart gallery, not a hidden tab set.

## Scene 3: Trust Chain

ProofPay is more than a dashboard. It accepts an external evidence pack, validates whether the package is assessable, turns the AI decision into settlement actions, and verifies that the Casper Testnet attestation matches the current payload.

Show:

- Evidence intake playground with clean, hold, and reject sample loaders.
- Click `Assess evidence` and show decision, risk score, confidence, evidence hash, decision hash, reasons, next actions, and mini dossier preview.
- Evidence coverage and Casper verifier mini charts.
- Settlement runbook actions for supplier, buyer, arbiter, and Casper.
- Casper verifier checks for evidence hash, decision hash, transaction hash, and stored URef.

## Scene 4: Evidence

The Evidence room keeps the decision explainable. Reviewers can inspect the source documents, extracted claims, and event timeline instead of trusting a black box.

Show:

- Clean release decision and confidence.
- Document status, claim extraction, and timeline tabs.

## Scene 5: Casper

The Casper panel exposes the real Testnet transaction, block height, named key, stored URef, public key, and the deploy command used for the attestation.

Mention:

- CSPR.live transaction link and copy buttons for tx hash, evidence hash, decision hash, stored URef, and replay command.
- Verification states for Testnet transaction recorded, payload hash match, named key documented, and stored URef documented.
- Successful Casper Testnet transaction `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`.
- Stored URef `uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007`.
- Contract and deploy details are documented in `docs/casper-testnet.md`.
- This is a Casper Testnet attestation proof; ProofPay does not custody real funds in this prototype.

## Scene 6: Audit Dossier

New in this iteration is the Audit Dossier. Every policy check becomes a trace card with expected value, observed value, status, impact, and evidence source.

Show:

- Passed trace cards for invoice amount, settlement currency, shipment identity, delivery confirmation, temperature band, and counterparty registry.
- Audit trace distribution chart.
- Verification chain with evidence hash, decision hash, local demo transaction, Casper Testnet transaction, and stored URef.
- Copy-ready JSON audit package.

## Scene 7: Hold Path

When the invoice amount is too high, ProofPay changes the decision to human review. The dossier marks invoice amount as failed and asks buyer finance to resolve the mismatch.

Show:

- `Hold for finance` scenario.
- Failed invoice amount trace.
- Human review decision.

## Scene 8: Reject Path

When the invoice fingerprint is duplicated, ProofPay blocks release and escalates the payment to fraud review. The failed trace stays visible in the same dossier format.

Show:

- `Reject duplicate` scenario.
- Blocked cockpit state.
- Fraud review escalation.

## Scene 9: Fresh Real Case

ProofPay can also run a new case, not only replay seeded scenarios. The video-integrated fresh case `examples/video-integrated-cold-chain-real-case.json` is the next Singapore to Istanbul cold-chain shipment on the same trade lane, with a new invoice, shipment id, evidence fingerprints, evidence hash, decision hash, and Casper Testnet attestation.

Show:

- The `Run real case` panel near the top of the dashboard.
- `npm run realcase:prepare -- examples/video-integrated-cold-chain-real-case.json`.
- `POST /api/real-case/prepare` returning the same evidence hash, decision hash, and verified deployment facts for the recorded fresh case.
- Fresh Casper Testnet transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`.
- Fresh named key `proofpay_attestation_ms-video-fresh-delivery-acceptance` and stored URef `uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007`.
- Make the boundary explicit: the hosted app prepared the attestation payload, the operator signed locally, and ProofPay does not custody real funds.

## Closing

ProofPay combines agentic evidence review, decentralized escrow operations, and Casper attestations. AI does the evidence work, humans control the payment action, and Casper makes the final decision auditable.
