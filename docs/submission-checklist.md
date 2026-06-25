# DoraHacks Submission Checklist

Use this checklist before manually submitting ProofPay Agent through the Casper hackathon `Submit BUIDL` flow.

## Required Fields And Assets

- Repository link: `https://github.com/Sskift/casper-proofpay-agent`
- Demo video: `https://github.com/Sskift/casper-proofpay-agent/blob/main/docs/demo/proofpay-agent-demo.mp4`
- Project name: `ProofPay Agent`
- Tag suggestions: `Agentic AI`, `DeFi`, `Real-World Assets`, `Casper Network`, `Web3`, `Rust`
- Track: `Casper Innovation Track`
- Public project summary: use the copy below.
- Copy-ready BUIDL fields: `docs/buidl-submission-brief.md`.
- Casper Testnet transaction hashes: `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`, `c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84`, `08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885`
- Live demo link: optional; local demo runs from this repository.
- Team members: fill manually in DoraHacks.

## Public Summary

ProofPay Agent is an autonomous milestone escrow agent for real-world assets. It reviews invoice, delivery, registry, and cold-chain evidence; makes a transparent release, hold, or reject recommendation; hashes the evidence bundle; and anchors the decision as a Casper attestation. The prototype targets Casper's Agentic AI, DeFi, and RWA track by turning off-chain delivery proof into an auditable on-chain payment decision.

## Problem

Real-world asset finance still depends on slow manual verification. Buyers do not want to release funds before delivery is proven. Suppliers do not want payment delays after delivery. AI agents can evaluate evidence quickly, but their decisions need an on-chain trust anchor.

## Solution

ProofPay Agent combines deterministic evidence checks, agentic decisioning, and Casper attestations:

- Evidence is normalized and hashed.
- The agent explains every release, hold, or reject decision.
- Casper stores the milestone attestation payload.
- The dashboard exposes the decision hash, evidence hash, transaction path, and smart contract status.

## Casper Alignment

- Uses Casper Testnet as the attestation layer.
- Includes a Casper Rust contract and Odra module sketch.
- Prepares payloads suitable for Casper SDK or CLI deploys.
- Maps directly to the buildathon's Agentic AI, DeFi, and RWA judging criteria.

## CSPR.fans Community Pitch

ProofPay Agent lets autonomous agents release real-world payments only when evidence checks out. It is a Casper-native trust layer for RWA escrow: AI verifies, Casper attests, humans can audit.

## Before Submission

- `npm run test` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `npm run submission:check` passes after the final commit.
- `npm run casper:check` shows a funded Testnet account.
- `npm run contract:deploy:testnet` returns a real Casper transaction hash.
- Dashboard sidebar clearly shows the active Cockpit, Journey, Trust, Charts, Evidence, Casper, or Dossier section.
- Dashboard Trust section shows external evidence intake, settlement runbook actions, and Casper verifier checks.
- Dashboard Evidence room shows reviewer summary, documents, claims, and timeline without table stacking.
- Dashboard Casper proof workbench shows Testnet transaction, named key, stored URef, deploy command, readiness gates, public key, and Casper session args.
- Demo video URL is public and tracked in `docs/demo/proofpay-agent-demo.mp4`.
- Casper Testnet transaction hash and stored attestation are documented in `docs/casper-testnet.md`.
- DoraHacks form copy is ready in `docs/buidl-submission-brief.md`.
- README links to contract, testnet docs, and demo script.
- README links to `docs/real-world-use.md` and documents `POST /api/evidence/intake`.
- Ignored generated artifacts are not uploaded manually: `node_modules/`, `.next/`, `target/`, `*.tsbuildinfo`.
- Non-ignored temporary files are removed or committed intentionally.
- The user explicitly confirms action-time submission on DoraHacks.

## Current On-chain Evidence

All three judge scenarios have successful Casper Testnet transactions:

```text
clean_tx: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
clean_block_height: 8282603
hold_tx: c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84
hold_block_height: 8285869
reject_tx: 08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885
reject_block_height: 8285872
public_key_hex: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
named_key: proofpay_attestation_ms-delivery-acceptance
current_named_key_uref: uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007
execution_error: null
```

The latest stored attestation payload is:

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x745f85d8760dde067cdf8b1e375139396e69bef7f40103209018acfea5c61ff9",
  "decision": "reject",
  "decision_hash": "0x95e24b90c3d51d52cd5babe1eaa3accb2d478c654f57ca7bb479b17cb515aa34",
  "confidence": 91,
  "risk_score": 88
}
```
