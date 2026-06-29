# ProofPay Next Iteration Agent Brief

Use this brief when handing ProofPay Agent to a future Codex session or another implementation agent. It captures the competitive gaps observed from the Casper Agentic Buildathon BUIDL field and turns them into a focused improvement plan.

## Objective

Move ProofPay from a polished static judge dashboard to a verifiable Casper RWA evidence-to-payment attestation product. The next iteration should make judges believe three things quickly:

1. ProofPay is not a generic x402 payment gateway.
2. ProofPay is not only a frontend.
3. ProofPay turns messy off-chain RWA delivery evidence into an auditable payment decision anchored on Casper.

## Competitive Pressure

The strongest competing BUIDLs emphasize one or more of these signals:

- Full-stack hosted apps on Vercel or Render.
- Live Casper Testnet contract links and transaction proofs.
- x402 and MCP as first-class product surfaces.
- README sections that separate "what is real" from "what is simulated".
- Strong demo videos with dynamic flows instead of slide-style narration.
- Visible quality signals such as tests, contracts, screenshots, live links, and clean runbooks.

ProofPay already has a strong RWA scenario, dashboard, Testnet transactions, contract materials, docs, screenshots, demo media, and local API hooks. The gap is that some of the proof is still buried in docs or only works locally.

## Product Positioning

Use this positioning consistently:

```text
ProofPay is the RWA evidence-to-payment attestation layer for Casper.
It reviews off-chain delivery evidence, recommends release/hold/reject,
keeps humans in control of real payment release, and records the exact
evidence hash and decision hash on Casper for later audit.
```

Avoid presenting ProofPay as:

- A generic x402 gateway.
- A production custodian of real funds.
- A purely autonomous payment bot.
- A legal, insurance, or compliance opinion engine.

## Known Shortcomings

| Gap | Why it matters | Preferred fix |
| --- | --- | --- |
| GitHub Pages is static | Judges can view the UI, but hosted API routes do not run there. | Use the Vercel full-stack demo as the primary public URL and keep GitHub Pages as a stable static backup. |
| Casper proof is visible but not one-click enough | Transaction hashes exist, but judges should not need to copy them manually. | Add explorer links, verify states, replay commands, and expected hash checks directly in the Casper panel. |
| Funds are not actually custodied | OutcomePay and Escrow402-style projects claim lock/settle/refund flows. | State the boundary clearly and present ProofPay as the attestation layer that can precede escrow release. |
| Agent path feels deterministic | Stable policy logic is good, but competitors advertise GPT/Gemini/live data. | Add an evidence intake playground and show the policy recomputing decisions from user-provided evidence JSON. |
| Quality signals are mostly local | Tests and build exist, but CI status is not visible. | Add GitHub Actions for test, typecheck, build, and submission check. |
| Demo may need re-recording after feature changes | A stale video weakens a polished submission. | Follow `docs/demo-recording-workflow.md`, render the ignored local MP4, redeploy it to the Vercel video host, and update the DoraHacks video URL. |

## Prioritized Workstreams

Current implementation status:

- P0 Casper Proof Workbench: completed in the dashboard with CSPR.live links, copy buttons, scenario-specific Testnet facts, verification states, and docs links.
- P0 Judge Walkthrough Mode: completed with Cockpit, Commerce, Trust, Evidence, Casper, and Dossier scroll steps.
- P1 Evidence Intake Playground: completed with API-first `POST /api/evidence/intake` assessment on a dynamic Next server, GitHub Pages client replay fallback, sample loaders, explicit assessment, invalid JSON handling, hashes, reasons, next actions, and mini dossier preview.
- P1 Agent Commerce Surface: completed with browser-run `POST /api/x402/proof-review`, `POST /api/mcp`, and `POST /api/settlement-adapter` checks on the full-stack dashboard.
- P1 CI and Repository Signals: completed with a dedicated Node 22 GitHub Actions workflow and README badge.
- P1 Full-Stack Hosted Demo: completed through the public Vercel deployment at `https://casper-proofpay-agent-web.vercel.app/`, while GitHub Pages remains the static public backup with client replay fallback.
- P1 Fresh Real Case: completed with `examples/video-integrated-cold-chain-real-case.json`, local signing, and Casper Testnet transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`.
- P2 Demo Refresh: recommended after final UI review because the judge story changed materially.

### P0: Casper Proof Workbench

Goal: make Casper verification obvious without reading docs.

Expected user-facing improvements:

- Each scenario shows a `View on cspr.live` link for its transaction.
- Each scenario shows transaction hash, block height, named key, stored URef, evidence hash, decision hash, and expected decision.
- Add a clear verification state such as `Recorded on Casper Testnet`, `Payload hash matches current scenario`, and `Stored URef documented`.
- Add copy buttons for transaction hash, evidence hash, decision hash, and replay command.
- Link to `docs/casper-testnet.md` and `docs/casper-cli-runbook.md` from the Casper panel.

Acceptance criteria:

- A judge can verify any of the three scenarios from the dashboard in under 30 seconds.
- The clean, hold, and reject scenarios each expose a valid explorer URL.
- Dashboard copy does not imply real fund custody.

### P0: Judge Walkthrough Mode

Goal: make the first three minutes deterministic for judges.

Expected user-facing improvements:

- Add a compact "Judge walkthrough" control near the top of the dashboard.
- The walkthrough lists six steps: Cockpit, Commerce, Trust, Evidence, Casper, Dossier.
- Clicking a step scrolls to the relevant section and highlights the proof the judge should inspect.
- The walkthrough includes a progress state so judges know where they are.

Acceptance criteria:

- The walkthrough works on desktop and mobile widths.
- It does not create layout shift or overlap with the left navigation.
- It helps tell the core story without adding explanatory marketing blocks.

### P1: Evidence Intake Playground

Goal: show that ProofPay can assess external evidence, not only seeded scenarios.

Expected user-facing improvements:

- Provide a textarea or structured editor for normalized evidence JSON.
- Include sample buttons for clean release, hold for finance, and reject duplicate.
- Recompute decision, risk score, confidence, evidence hash, decision hash, and dossier preview on submit.
- If hosted static mode cannot call API routes, run the same deterministic assessment client-side and show the API route status clearly in the dashboard.

Acceptance criteria:

- Invalid JSON shows a friendly validation error.
- Sample evidence can be loaded and assessed without leaving the page.
- The recomputed hashes match the active dossier for seeded scenarios.

### P1: Full-Stack Hosted Demo

Goal: reduce the "static frontend" objection.

Preferred options:

1. Vercel for the Next.js app and API routes.
2. Render or Railway for API-only routes while GitHub Pages remains the static dashboard.
3. Keep GitHub Pages as canonical if full-stack hosting introduces reliability risk.

Acceptance criteria:

- Hosted `GET /api/attestation/clean` returns JSON.
- Hosted `POST /api/evidence/intake` returns a decision for a sample payload.
- DoraHacks live demo URL points to the most reliable public experience.
- README explains which endpoints run online and which require local reproduction.

### P1: CI and Repository Signals

Goal: make build quality visible before a judge runs anything.

Expected repository improvements:

- Add a GitHub Actions workflow for Node 22+.
- Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run submission:check`.
- Add a README status badge after the workflow passes.

Acceptance criteria:

- The workflow passes on `main`.
- It does not publish Pages unless explicitly intended.
- README badges do not point to broken or flaky workflows.

### P2: Demo Refresh

Goal: record a final video only after meaningful product changes land.

Expected output:

- Updated narration in `docs/demo/proofpay-agent-demo-narration.txt`.
- Updated ignored local video at `docs/demo/proofpay-agent-demo.mp4` for DoraHacks upload.
- No local recording temp files committed.
- DoraHacks video asset is replaced manually in the BUIDL form when the final MP4 changes.

Follow `docs/demo-recording-workflow.md`.

## Copy-Paste Implementation Prompt

```text
You are a senior product engineer and hackathon finisher working on ProofPay Agent.

Repository:
/Users/bytedance/Desktop/test/casper-proofpay-agent

Context:
ProofPay Agent is a Casper Agentic Buildathon submission. It is an RWA evidence-to-payment attestation layer: off-chain delivery evidence enters the system, an agent recommends approve/hold/reject, humans retain real payment release authority, and Casper records evidence hash + decision hash for audit. The current public demo is GitHub Pages, and the repo already includes dashboard UI, local API hooks, packages/agent scoring logic, packages/casper attestation payloads, Casper/Odra contract materials, Testnet transaction evidence, screenshots, README, and demo video.

Read first:
- README.md
- docs/hackathon-constraints.md
- docs/casper-testnet.md
- docs/casper-cli-runbook.md
- docs/real-world-use.md
- docs/submission-checklist.md
- docs/demo-script.md
- docs/demo-recording-workflow.md
- packages/agent
- packages/casper
- apps/web
- contracts/proofpay-attestation

Competitive gap:
Strong competitors emphasize full-stack hosted APIs, one-click Testnet proof, x402/MCP surfaces, CI badges, and dynamic demo videos. ProofPay is strong on RWA workflow and auditability, but the next iteration must make the proof chain more obvious and reduce the perception that this is only a frontend.

Non-negotiables:
- Do not change the core product thesis.
- Do not claim ProofPay custodies real funds.
- Do not remove existing Casper transaction evidence.
- Do not commit node_modules, .next, apps/web/out, target, .local, screen recordings, API keys, PATs, private keys, or generated temp assets.
- Follow existing UI style. No oversized marketing landing page.
- Keep the dashboard usable on desktop and mobile.
- Keep DoraHacks links stable unless a better public demo is deployed and verified.

Primary tasks, in order:
1. Add a Casper proof workbench upgrade:
   - Explorer links for clean, hold, and reject transactions.
   - Copyable transaction hash, evidence hash, decision hash, stored URef, and replay command.
   - Clear verification states: Testnet transaction recorded, payload hash matches, named key documented, stored URef documented.
   - Link to docs/casper-testnet.md and docs/casper-cli-runbook.md.

2. Add a Judge walkthrough mode:
   - Six steps: Cockpit, Commerce, Trust, Evidence, Casper, Dossier.
   - Clicking a step scrolls to the section and highlights what to inspect.
   - No layout overlap with the left navigation.
   - Works at desktop and mobile widths.

3. Add an Evidence intake playground:
   - JSON input with seeded sample loaders for clean release, hold for finance, reject duplicate.
   - Friendly validation for invalid JSON.
   - Recompute decision, risk score, confidence, evidence hash, decision hash, and dossier preview.
   - If API routes are unavailable in static mode, use client-side deterministic assessment or document local replay.

4. Add CI quality signal:
   - GitHub Actions workflow using Node 22+.
   - Run npm install, npm test, npm run typecheck, npm run build, npm run submission:check.
   - Add a README badge only after the workflow passes.

5. Update docs:
   - README: clarify "what is real / what is simulated / how to verify".
   - docs/buidl-submission-brief.md: keep the top story sharp and current.
   - docs/submission-checklist.md: add any new verification or demo steps.

6. Decide whether to re-record the demo:
   - Re-record only if the UI/product story materially changed.
   - If re-recording, follow docs/demo-recording-workflow.md.
   - Commit narration/docs updates, but keep docs/demo/proofpay-agent-demo.mp4 as an ignored local upload asset.

Verification commands:
- npm install
- npm test
- npm run typecheck
- npm run build
- npm run pages:build
- npm run submission:check
- git status --short

Browser verification:
- Open the local dashboard.
- Test scenario switching for clean, hold, reject.
- Test Judge walkthrough navigation.
- Test evidence intake with valid and invalid JSON.
- Test Casper explorer links.
- Check desktop and mobile viewports for overlap.

Final response requirements:
- Summarize changes by product area.
- List verification commands and results.
- State whether DoraHacks needs an update.
- State whether demo video needs re-recording.
- State any remaining risks or intentionally deferred items.
```

## Definition Of Done

The next iteration is ready to submit only when:

- `npm test`, `npm run typecheck`, `npm run build`, `npm run pages:build`, and `npm run submission:check` pass.
- Public demo URL returns HTTP 200.
- README links to the live demo, DoraHacks BUIDL, Casper Testnet proof, and demo recording workflow.
- DoraHacks BUIDL description matches the current repo state.
- No temporary recording, build, or dependency artifacts are left on Desktop or committed in git.
- The final demo video, if changed, is redeployed to the Vercel video host and remains ignored locally at `docs/demo/proofpay-agent-demo.mp4`.
