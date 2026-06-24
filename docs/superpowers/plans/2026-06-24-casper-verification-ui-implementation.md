# Casper Verification UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clearer Casper verification workbench and reduce Dossier text density without recording a new demo.

**Architecture:** Keep product facts in `packages/casper`, keep dashboard composition in `apps/web/src/app/page.tsx`, and keep visual density controlled through `apps/web/src/app/globals.css`. Use small derived summaries instead of adding backend state.

**Tech Stack:** TypeScript, Next.js, React, HeroUI tabs, lucide-react icons, Vitest, existing layout contract script.

---

### Task 1: Casper Verification Summary

**Files:**
- Modify: `packages/casper/src/types.ts`
- Modify: `packages/casper/src/deploy-plan.ts`
- Modify: `packages/casper/src/index.ts`
- Test: `packages/casper/src/casper.test.ts`

- [ ] Add `CasperVerificationSummary` with `state`, `label`, `detail`, `network`, `primaryHash`, and `checkedAt`.
- [ ] Add `createCasperVerificationSummary(plan)` that returns `recorded` for plans with deployment and `pending` otherwise.
- [ ] Write tests for clean and hold/reject scenarios.

### Task 2: Dashboard Layout Contract

**Files:**
- Modify: `apps/web/scripts/check-dashboard-layout.mjs`

- [ ] Add source checks for `proof-flow`, `proof-tabs`, `dossier-tabs`, and `dossier-meter`.
- [ ] Run the web test and confirm it fails before UI implementation.

### Task 3: Casper Proof Workbench UI

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Replace the raw Casper proof list with summary cards, a visual transaction path, and tabs for transaction, payload, and deploy command details.
- [ ] Keep undeployed scenarios visibly pending.
- [ ] Keep full hashes accessible through `title` attributes.

### Task 4: Dossier Console UI

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Replace the right-side wall of verification/checklist/JSON blocks with tabs.
- [ ] Add a compact trace meter showing passed/warning/failed/pending counts.
- [ ] Keep JSON and reviewer checklist available in secondary tabs.

### Task 5: Verification and Publish

**Commands:**
- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run submission:check`
- Visual smoke check with local Next server and screenshots
- `git status --short`
- `git commit`
- `git push`
