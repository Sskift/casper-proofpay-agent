# Product Depth Iteration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Evidence Intake, role workflow, agent evaluation, and lightweight ecosystem API hooks while keeping the dashboard polished and submission-safe.

**Architecture:** Extend `packages/agent` with derived judge-mode product models, expose honest Casper/agent integration routes in `apps/web/src/app/api`, and render the new product depth as compact dashboard sections in `apps/web/src/app/page.tsx`. Avoid new dependencies and keep long protocol details behind tabs or docs.

**Tech Stack:** TypeScript, Vitest, Next.js App Router route handlers, React, HeroUI tabs, lucide-react icons, existing CSS system.

---

### Task 1: Agent Product Models

**Files:**
- Modify: `packages/agent/src/dashboard.ts`
- Modify: `packages/agent/src/index.ts`
- Test: `packages/agent/src/agent.test.ts`

- [ ] Add intake, workflow, and evaluation model types.
- [ ] Add `createProductDepthModel` that derives models from seeded deals and evidence bundles.
- [ ] Test clean/hold/reject rows, role statuses, and document confidence/status mapping.

### Task 2: Ecosystem API Routes

**Files:**
- Create: `apps/web/src/app/api/attestation/[scenario]/route.ts`
- Create: `apps/web/src/app/api/mcp/route.ts`
- Create: `apps/web/src/app/api/x402/release-decision/route.ts`
- Create: `apps/web/src/app/api/proofpay-data.ts`
- Test: `apps/web/scripts/check-dashboard-layout.mjs`

- [ ] Add a shared route helper that builds assessment, payload, deploy plan, verification summary, and dossier for a scenario.
- [ ] Add source-contract checks for route paths and honest x402/MCP wording.
- [ ] Keep route output deterministic and free of secrets.

### Task 3: Dashboard UI Depth

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Test: `apps/web/scripts/check-dashboard-layout.mjs`

- [ ] Add a new Journey section to the sidebar and dashboard.
- [ ] Render Evidence Intake, role workflow, evaluation matrix, and ecosystem API cards.
- [ ] Keep long protocol details in tabs and avoid a text wall.

### Task 4: Casper Deploy Attempt

**Files:**
- Modify docs only if new transactions are produced.

- [ ] Run `npm run casper:check`.
- [ ] If funded and ready, run hold/reject deploy scripts.
- [ ] Record real hashes only when the client returns accepted transactions.
- [ ] If not possible, leave UI as deploy-ready and document the blocker.

### Task 5: Polish, Verify, Publish

**Commands:**
- `npm run test`
- `npm run typecheck`
- `npm run build`
- Desktop/mobile visual smoke check
- `npm run submission:check`
- `git commit`
- `git push origin main`
