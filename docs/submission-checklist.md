# DoraHacks Submission Checklist

Use this checklist before manually submitting ProofPay Agent through the Casper hackathon `Submit BUIDL` flow.

## Required Fields And Assets

- Repository link: `https://github.com/Sskift/casper-proofpay-agent`
- Demo video: record using `docs/demo-script.md`, upload publicly, then paste the final URL into DoraHacks.
- Project name: `ProofPay Agent`
- Tag suggestions: `Agentic AI`, `DeFi`, `Real-World Assets`, `Casper Network`, `Web3`, `Rust`
- Track: `Casper Innovation Track`
- Public project summary: use the copy below.
- Casper Testnet deploy hash: add after `docs/casper-testnet.md` is completed.
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
- `npm run casper:check` shows a funded Testnet account.
- `npm run contract:deploy:testnet` returns a real Casper transaction hash.
- Dashboard proof panel shows readiness, faucet public key, post-funding commands, and Casper session args.
- Demo video URL is public.
- Casper Testnet deploy hash is documented in `docs/casper-testnet.md`, or the faucet/account funding blocker is clearly documented.
- README links to contract, testnet docs, and demo script.
- The user explicitly confirms action-time submission on DoraHacks.

## Current External Blocker

The local Casper CLI path is ready, but the generated Testnet account is not funded yet:

```text
public_key_hex: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
status: state_get_account_info -> No such account
```

Fund the matching account through the CSPR.live Testnet faucet, then run:

```bash
npm run casper:check
PROOFPAY_SCENARIO="clean" npm run contract:deploy:testnet
```
