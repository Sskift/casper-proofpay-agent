# Casper Verification UI Design

## Goal

Make the next ProofPay Agent iteration feel more like a verifiable Casper product and less like a static dashboard, while keeping the page calm enough for judges to scan.

## Scope

This iteration does not re-record the demo video and does not pretend that undeployed scenarios are on-chain. The clean scenario keeps the recorded Casper Testnet deployment. Hold and reject scenarios remain deploy-ready until real Testnet transactions are recorded.

## Product Shape

The Casper section becomes a proof workbench with four layers:

1. Verification summary: status, network, deploy state, and the most important transaction fact.
2. Transaction path: compact visual steps from evidence hash to agent decision to Casper write.
3. Detail tabs: transaction, payload, and deploy command details move behind secondary controls.
4. Readiness gates: unchanged conceptually, but presented as concise gate cards.

The Dossier section becomes an audit console rather than a wall of text:

1. A compact summary shows decision, risk, trace pass rate, and on-chain status.
2. Trace cards remain visible because they are the main evidence story.
3. Verification rows, reviewer checklist, and JSON package move into tabs.
4. Long hashes use shortened display values with full values in tooltips.

## Data Boundaries

The Casper package should expose a small verification summary derived from a deploy plan. It should distinguish recorded, pending, and blocked states without network access. Later, a client-side live verifier can replace or augment that summary by calling CSPR.cloud or a Casper RPC endpoint.

## UI Principles

- Keep top-level sections scannable.
- Prefer compact state cards, flow nodes, tabs, and detail drawers over raw text blocks.
- Keep command lines and JSON copy-ready, but place them behind secondary tabs.
- Preserve responsive layouts across desktop and mobile.
- Do not add decorative visuals that do not explain product state.

## Verification

Automated checks must cover:

- Clean scenario reports a recorded Casper verification state.
- Hold/reject scenarios report pending deploy state.
- The dashboard source contains the new proof flow and secondary Dossier tabs.
- Existing tests, typecheck, build, and submission check still pass.
