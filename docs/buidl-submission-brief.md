# ProofPay Agent BUIDL Submission Brief

Use this as the copy source for the DoraHacks `Submit BUIDL` form. The actual submission should still be completed manually by the user in the browser.

## Project Name

ProofPay Agent

## One-liner

Agentic RWA milestone escrow on Casper: AI verifies off-chain delivery evidence, then Casper records the payment decision as an auditable Testnet attestation.

## Short Description

ProofPay Agent is an autonomous milestone escrow prototype for real-world assets. It reviews invoices, delivery documents, registry data, and cold-chain telemetry; recommends release, hold, or reject; hashes the evidence bundle; verifies Casper attestation facts; and anchors all three judge scenarios on Casper Testnet with a transaction-producing smart contract component.

## Long Description

ProofPay Agent targets a common RWA finance problem: buyers do not want to release escrowed funds before delivery is proven, while suppliers do not want to wait through slow manual verification after delivery. The prototype models a temperature-controlled vaccine shipment and turns the review process into an operator cockpit.

The agent normalizes five evidence sources: invoice, bill of lading, signed delivery note, temperature log, and supplier registry snapshot. It extracts claims, checks amount, shipment, counterparty, delivery, duplicate invoice, and cold-chain consistency, then produces one of three transparent decisions:

- `approve`: evidence aligns and the milestone can be released.
- `hold`: delivery evidence is credible, but finance must review an amount mismatch.
- `reject`: duplicate invoice evidence blocks release.

Every assessment produces an evidence hash and decision hash. All three judge scenarios are anchored on Casper Testnet through the `proofpay-attestation` contract path. A fourth video-integrated fresh case was also prepared from a new redacted evidence JSON package and anchored on Casper Testnet as transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`. The dashboard shows the Testnet transaction hash, block height, named key, stored URef, public key, deploy command, session arguments, submission readiness gates, and a portable Audit Dossier.

The user experience is designed for judges and operators: a scroll-tracked left navigation, clear Cockpit, Journey, Trust, Charts, Evidence, Casper, and Dossier sections, a compact Judge walkthrough, an API-first evidence intake playground with clean/hold/reject JSON samples and static replay fallback, a settlement runbook, a Casper payload-to-Testnet verifier, an Evidence review workbench, a Casper proof workbench with CSPR.live links and copy buttons, and an Audit Dossier that packages the reasoning trace, hashes, Testnet proof facts, CLI command, and reviewer checklist into a copy-ready JSON artifact.

The core advantage is the trust chain, not the UI alone: external evidence enters as a validated package, AI produces a bounded and explainable payment decision, Casper makes the decision auditable, and humans still control the final release, hold, or dispute action. The repo also includes a `realcase:*` CLI path so a new redacted evidence JSON can be prepared and signed into a fresh Casper Testnet attestation without relying on the pre-recorded judge transactions.

Prototype boundary: ProofPay does not custody real funds or claim production automatic settlement. It creates the missing RWA evidence decision layer before release: evidence normalization, bounded AI review, human release control, and Casper attestations that make the decision replayable.

Full-stack demo note: the public Vercel deployment at `https://casper-proofpay-agent-web.vercel.app/` lets judges call `GET /api/health`, `GET /api/attestation/clean`, `POST /api/evidence/intake`, and `POST /api/real-case/prepare`. GitHub Pages remains the static fallback dashboard.

## Casper Integration

ProofPay uses Casper as the trust anchor for agentic RWA payment decisions.

- Casper Testnet transaction hash: `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`
- Hold scenario transaction hash: `c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84`
- Reject scenario transaction hash: `08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885`
- Fresh real-case transaction hash: `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`
- Clean block height: `8282603`
- Hold block height: `8285869`
- Reject block height: `8285872`
- Fresh real-case block height: `8305098`
- Named key: `proofpay_attestation_ms-delivery-acceptance`
- Fresh real-case named key: `proofpay_attestation_ms-video-fresh-delivery-acceptance`
- Clean stored URef: `uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007`
- Hold stored URef: `uref-798a146f6456d0318bb0e960465a7e251321fc1ff32c36d4354bd5860a9a6d7a-007`
- Reject stored URef: `uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007`
- Fresh real-case stored URef: `uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007`
- Contract package: `contracts/proofpay-attestation`
- Testnet documentation: `docs/casper-testnet.md`

The stored attestation payload contains:

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1",
  "decision": "approve",
  "decision_hash": "0x9f691d379eef71639e776e80d1272a464f39848d1c39566d8dfb0c0beb68f74c",
  "confidence": 94,
  "risk_score": 12
}
```

The fresh real-case payload stores:

```json
{
  "milestone_id": "ms-video-fresh-delivery-acceptance",
  "evidence_hash": "0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803",
  "decision": "approve",
  "decision_hash": "0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d",
  "confidence": 94,
  "risk_score": 12
}
```

## Track Fit

Casper Innovation Track: Agentic AI, DeFi, and Real-World Assets.

ProofPay combines:

- Agentic AI: autonomous evidence extraction, risk scoring, explainable release decisions, and reviewer next steps.
- DeFi: milestone escrow release logic and payment decision auditability.
- Real-World Assets: delivery, invoice, registry, and cold-chain proof for a physical shipment.
- Casper Testnet: transaction-producing attestation component with documented on-chain state.
- Auditability: judge-facing dossier with policy trace, normalized observations, evidence hash, decision hash, Casper proof facts, verifier checks, settlement actions, and reproduction checklist.

## Technical Stack

- Next.js app router
- React
- TypeScript
- HeroUI
- Recharts
- Casper Rust contract materials
- Casper CLI deployment scripts
- Vitest package tests

## Repository

`https://github.com/Sskift/casper-proofpay-agent`

## Demo Video

Submission URL:

`https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4`

Use the Vercel-hosted MP4 URL in the DoraHacks BUIDL form. Do not use a GitHub MP4 URL as the primary demo video asset.

Local render path:

`docs/demo/proofpay-agent-demo.mp4` (ignored by Git)

Record with `docs/demo-script.md`.

The prepared video follows this flow:

1. Open the dashboard and show the seven operator sections.
2. Use the Judge walkthrough to move through Cockpit, Trust, Evidence, Casper, and Dossier.
3. Select `Clean release` and explain the approve decision.
4. In Trust, load a sample evidence bundle and click `Assess evidence`; on a dynamic Next server the dashboard calls `POST /api/evidence/intake`, while GitHub Pages falls back to deterministic client replay.
5. Open the Evidence room and show document, claim, and timeline drilldowns.
6. Open the Casper section and show the CSPR.live link, copy buttons, Testnet transaction hash, named key, stored URef, deploy command, and verification states.
7. Open the Dossier section and show the trace cards, verification chain, copy-ready JSON package, and reviewer checklist.
8. Switch to `Hold for finance` and explain amount mismatch handling.
9. Switch to `Reject duplicate` and explain duplicate invoice blocking.
10. Open the repository docs and point to `docs/casper-testnet.md` and `docs/real-world-use.md`.
11. Open the `Run real case` panel and show the fresh Testnet transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` for the video-integrated cold-chain case.
12. If the Vercel deployment is live, open `/api/health` and show the public API route returning Testnet proof metadata.

## CSPR.fans Community Pitch

ProofPay Agent makes AI payment decisions auditable. It verifies real-world delivery evidence, recommends whether escrow should release, and records the decision on Casper. AI does the work; Casper makes the trust anchor visible.

## Final Submission Fields To Fill Manually

- Team member profile details
- Live demo URL: `https://casper-proofpay-agent-web.vercel.app/`
- Static backup URL: `https://sskift.github.io/casper-proofpay-agent/`
- Demo video URL: `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4`
- Project socials, if created before final submission
- DoraHacks organizer disclaimer confirmation
