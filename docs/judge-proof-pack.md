# Judge Proof Pack

This is the single verification entry point for judges who want to check what is running, what is recorded on Casper Testnet, and what is intentionally outside this prototype.

## Public Links

| Asset | URL |
| --- | --- |
| Full-stack live demo | `https://casper-proofpay-agent-web.vercel.app/` |
| Static backup demo | `https://sskift.github.io/casper-proofpay-agent/` |
| Demo video | `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4` |
| DoraHacks BUIDL | `https://dorahacks.io/buidl/45992` |
| GitHub repository | `https://github.com/Sskift/casper-proofpay-agent` |
| Judge proof API | `https://casper-proofpay-agent-web.vercel.app/api/judge-proof` |
| Health API | `https://casper-proofpay-agent-web.vercel.app/api/health` |

## What Is Real

- The Vercel deployment runs the Next.js dashboard and API routes.
- `GET /api/attestation/clean`, `GET /api/attestation/amountMismatch`, and `GET /api/attestation/duplicateInvoice` return recorded Casper Testnet proof facts.
- `POST /api/evidence/intake` accepts normalized external evidence JSON and recomputes the decision, risk score, evidence hash, decision hash, and dossier data.
- `POST /api/real-case/prepare` prepares a new real-case payload for local signing.
- Four Casper Testnet transactions are recorded: clean release, finance hold, duplicate reject, and the fresh video-integrated cold-chain case.

## What Is Simulated Or Bounded

- ProofPay does not custody, release, refund, or settle real funds in this prototype.
- The three judge scenarios use synthetic evidence for repeatable demonstration.
- New Casper Testnet submissions require local signing with a funded local key. Private keys are not stored in the repository, Vercel, DoraHacks, or the video.
- The x402 and MCP surfaces are demo integration hooks, not production payment settlement or a hosted MCP session.

## Casper Testnet Proofs

| Case | Decision | Transaction | Block | Stored URef |
| --- | --- | --- | --- | --- |
| Clean release | `approve` | `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604` | `8282603` | `uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007` |
| Hold for finance | `hold` | `c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84` | `8285869` | `uref-798a146f6456d0318bb0e960465a7e251321fc1ff32c36d4354bd5860a9a6d7a-007` |
| Reject duplicate | `reject` | `08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885` | `8285872` | `uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007` |
| Fresh cold-chain case | `approve` | `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` | `8305098` | `uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007` |

Explorer links:

- `https://testnet.cspr.live/transaction/94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`
- `https://testnet.cspr.live/transaction/c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84`
- `https://testnet.cspr.live/transaction/08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885`
- `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`

## Fast Verification Path

1. Open the live demo and use the Judge walkthrough.
2. Open `GET /api/health` and confirm `status: ok`.
3. Open `GET /api/judge-proof` and confirm it returns the same public links and transaction hashes listed above.
4. Open the fresh case CSPR.live transaction and confirm it is a Casper Testnet transaction.
5. Read `docs/real-case-execution.md` for the evidence hash, decision hash, stored URef, and replay commands.

## Local Verification Commands

```bash
npm test
npm run typecheck
npm run build
npm run pages:build
npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app
npm run submission:check
```
