# ProofPay Agent Demo Script

Target length: 140 to 160 seconds.

The submitted demo video is a single combined product introduction and real-case walkthrough. It should feel like a live product demo: browser movement, section navigation, scenario switching, API-backed evidence replay, Casper proof, and the fresh real-case transaction are all visible in one flow.

The rendered MP4 is kept locally at `docs/demo/proofpay-agent-demo.mp4` for manual upload to DoraHacks. The MP4 is intentionally ignored by Git so the repository stays lightweight.

The exact narration source lives at `docs/demo/proofpay-agent-demo-narration.txt`.

For recording setup, voiceover handling, ffmpeg commands, quality review, and cleanup rules, use `docs/demo-recording-workflow.md`.

## Scene 1: Product Thesis

ProofPay Agent is the evidence-to-payment attestation layer for RWA payments on Casper. It reviews delivery evidence before a payment release can move forward.

Show:

- Vercel dashboard at `https://casper-proofpay-agent-web.vercel.app/` or local full-stack dashboard at `http://127.0.0.1:3000`.
- Top cockpit and Judge walkthrough.
- Release readiness, risk, confidence, evidence coverage, and Casper anchor metrics.
- Clear boundary: ProofPay does not custody real funds in this prototype.

## Scene 2: Trust Chain And Intake

External evidence enters as a normalized package. The agent recomputes the decision, evidence hash, decision hash, reasons, next actions, and mini dossier.

Show:

- Trust Chain section.
- Evidence intake playground.
- Load a sample and click `Assess evidence`.
- The result grid with decision, risk score, confidence, evidence hash, decision hash, reasons, actions, and mini dossier preview.
- Settlement runbook and Casper verifier checks.

## Scene 3: Three Decision Paths

ProofPay demonstrates approve, hold, and reject. This is not a single happy-path dashboard.

Show:

- `Clean release`: ready to release.
- `Hold for finance`: invoice amount mismatch and human finance review.
- `Reject duplicate`: duplicate invoice and fraud escalation.
- Keep the decision cards and reviewer action queue visible after switching.

## Scene 4: Evidence Room

The Evidence room keeps the AI explainable. Reviewers can inspect source documents, normalized claims, timeline events, reasons, and follow-up actions.

Show:

- Document tab.
- Claims tab.
- Timeline tab.
- Reasons or follow-up tab.

## Scene 5: Casper Proof

Casper is the trust anchor for the decision proof.

Show:

- Casper proof workbench.
- CSPR.live transaction link and copy buttons for tx hash, evidence hash, decision hash, stored URef, and replay command.
- Testnet transaction hash, block height, named key, stored URef, public key, session args, and verification states.
- Successful seeded clean transaction `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`.

## Scene 6: Fresh Real Case

This is the proof that the system can run a new business event, not only replay the three seeded judge scenarios. The video-integrated fresh case is `examples/video-integrated-cold-chain-real-case.json`: a follow-on cold-chain shipment where the buyer needs payment-release confidence before approving a supplier milestone.

Show:

- `Run real case` panel near the top of the dashboard.
- Fresh case proof card with `fresh tx recorded`.
- The API returning `verified` for the same evidence JSON.
- The fresh Casper Testnet transaction executed successfully.
- Block height, named key, stored URef, and verification checks visible on screen without reading long hashes aloud.
- The boundary: the hosted app prepares and verifies the payload; the operator signs locally; ProofPay does not custody funds.

## Scene 7: CSPR.live Verification

Open or briefly show the CSPR.live transaction page for the fresh case as supporting proof, not as the main story.

Show:

- Transaction page URL:
  `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`
- If the explorer is slow, keep the dashboard proof card visible and say the transaction executed, the API verifies the facts, and the full URL is documented in `docs/real-case-execution.md`.

## Scene 8: Audit Dossier And Close

The Audit Dossier packages the case for buyers, suppliers, arbiters, and judges.

Show:

- Dossier section.
- Policy trace cards.
- Verification chain.
- Copy-ready JSON package.

Closing line:

ProofPay is not a generic payment gateway. It is the evidence-to-payment attestation layer missing from real-world asset settlement.
