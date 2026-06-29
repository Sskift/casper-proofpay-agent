# Judge Entry

This is the shortest verification path for ProofPay Agent.

## Start Here

| Asset | URL |
| --- | --- |
| Full-stack demo | `https://casper-proofpay-agent-web.vercel.app/` |
| Demo video | `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4` |
| Judge proof API | `https://casper-proofpay-agent-web.vercel.app/api/judge-proof` |
| Fresh Casper Testnet transaction | `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` |
| Full proof pack | `docs/judge-proof-pack.md` |

## What To Check In Three Minutes

1. Open the full-stack demo and use the Judge walkthrough: Cockpit, Trust, Evidence, Casper, Dossier.
2. In Trust, load a sample evidence package and assess it. The dynamic demo calls `POST /api/evidence/intake`; the static backup uses deterministic client replay.
3. In Casper, switch clean, hold, and reject scenarios. Each scenario has a recorded Casper Testnet transaction, block height, named key, stored URef, evidence hash, and decision hash.
4. Open the fresh CSPR.live transaction. This is the video-integrated cold-chain case recorded after the seeded judge scenarios.
5. Open the Dossier panel and compare the decision trace, hashes, Casper proof facts, and reviewer checklist.

## Real Boundary

- Real: evidence normalization, deterministic agent review, risk scoring, evidence hashes, decision hashes, full-stack API routes, recorded Casper Testnet attestations, and a fresh video-integrated Testnet case.
- Simulated: production custody, automatic release of real funds, production OCR/identity checks, and hosted MCP settlement operations.
- Human-controlled: ProofPay recommends approve, hold, or reject; a human still controls any real payment action.

## Replay Commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app
```

