# Dashboard Slimming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slim the Cockpit, Charts, and Evidence dashboard areas while preserving proof visibility and submission readiness.

**Architecture:** Keep the existing `page.tsx` dashboard composition and CSS system. Add source-contract checks first, then reorganize existing data into summary strips, tabs, and compact visual rails without changing agent or Casper data models.

**Tech Stack:** TypeScript, Next.js App Router, React, HeroUI tabs, Recharts chart components, lucide-react icons, existing CSS.

---

### Task 1: Source Contract Red Test

**Files:**
- Modify: `apps/web/scripts/check-dashboard-layout.mjs`

- [ ] Add required page contracts for `decision-spine`, `cockpit-tabs`, `chart-summary-strip`, `chart-tabs`, `evidence-summary-meter`, and `evidence-review-tabs`.
- [ ] Add required CSS contracts for `.decision-spine`, `.cockpit-tabs`, `.chart-summary-strip`, `.chart-tabs`, `.evidence-summary-meter`, and `.evidence-review-tabs`.
- [ ] Run `npm --workspace apps/web run test` and verify it fails because the new slimming structures are not implemented yet.

### Task 2: Cockpit Slimming

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Replace the always-expanded action card with a compact decision spine.
- [ ] Add cockpit tabs for action queue, Casper hashes, and actor handoff.
- [ ] Preserve the readiness KPI cards and on-chain block/hash facts.
- [ ] Run `npm --workspace apps/web run test` and verify cockpit source contracts pass.

### Task 3: Charts Slimming

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Add a chart summary strip with current risk, cold-chain band, cashflow state, and evidence coverage.
- [ ] Move charts into `chart-tabs` so one chart renders per selected tab.
- [ ] Render charts with Recharts `ResponsiveContainer`, `LineChart`, `BarChart`, `Tooltip`, `Legend`, and `CartesianGrid` components so tab panels do not produce blank responsive containers.
- [ ] Keep all four chart components available for reviewers.
- [ ] Run `npm --workspace apps/web run test` and verify chart source contracts pass.

### Task 4: Evidence Slimming

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Replace always-visible reasons with an evidence summary meter.
- [ ] Add evidence review tabs for documents, claims, timeline, reasons, and follow-up.
- [ ] Preserve verdict confidence, policy version, flags, and required follow-up.
- [ ] Run `npm --workspace apps/web run test` and verify evidence source contracts pass.

### Task 5: Verification And Publish

**Commands:**
- `npm run test`
- `npm run typecheck`
- `npm run build`
- Desktop and mobile visual smoke check
- `npm run submission:check`
- `git commit`
- `git push origin main`
