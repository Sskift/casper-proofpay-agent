# ProofPay Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DoraHacks-submission-ready ProofPay Agent prototype for the Casper Agentic Buildathon.

**Architecture:** Use a TypeScript npm workspace with a Next.js app, a deterministic evidence agent package, a Casper adapter package, and an Odra/Casper smart contract package. The app runs a polished judge-mode workflow locally, produces evidence hashes and attestation payloads, and treats Casper Testnet transaction production as the submission target.

**Tech Stack:** Next.js, React, TypeScript, Vitest, lucide-react, npm workspaces, Odra/Casper Rust contract source, `casper-js-sdk`/Casper CLI documentation-backed testnet path.

---

## File Structure

- `package.json`: root workspace scripts for install, dev, test, typecheck, build.
- `tsconfig.base.json`: shared TypeScript compiler options.
- `apps/web`: Next.js application and UI.
- `apps/web/src/app/page.tsx`: main dashboard and judge-mode workflow.
- `apps/web/src/app/globals.css`: operational finance UI styling.
- `apps/web/src/components/*`: focused UI panels for deals, evidence, assessment, and on-chain proof.
- `packages/agent`: evidence model, seeded RWA deals, scoring policy, hash utilities.
- `packages/agent/src/agent.test.ts`: unit tests for approve, hold, reject outcomes.
- `packages/casper`: attestation payload builder, demo transaction adapter, testnet configuration boundary.
- `packages/casper/src/casper.test.ts`: unit tests for deterministic hashes and payload shape.
- `contracts/proofpay-attestation`: Casper contract source and README.
- `docs/hackathon-constraints.md`: canonical DoraHacks/Casper constraints that implementation must satisfy.
- `docs/demo-script.md`: 2 to 3 minute video script.
- `docs/submission-checklist.md`: DoraHacks requirement mapping.
- `docs/casper-testnet.md`: key, faucet, deploy, and transaction instructions.
- `README.md`: project overview, setup, architecture, demo flow, and submission notes.

## Task 0: Hackathon Constraints Baseline

**Files:**
- Create: `docs/hackathon-constraints.md`
- Modify: `docs/superpowers/specs/2026-06-23-proofpay-agent-design.md`
- Modify: `docs/superpowers/plans/2026-06-23-proofpay-agent-implementation.md`

- [x] **Step 1: Record DoraHacks and Casper constraints**

Record the required BUIDL submission path, GitHub/demo video requirements, Casper Testnet transaction-producing component requirement, judging criteria, CSPR.fans path, and Casper ecosystem tooling priorities.

- [x] **Step 2: Update design and plan**

Update spec and plan so local demo mode is only a fallback, while Odra/Casper Testnet attestation is the submission target.

- [x] **Step 3: Commit constraints**

Run:

```bash
git add docs/hackathon-constraints.md docs/superpowers/specs/2026-06-23-proofpay-agent-design.md docs/superpowers/plans/2026-06-23-proofpay-agent-implementation.md
git commit -m "docs: capture Casper buildathon constraints"
```

## Task 1: Workspace Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `packages/agent/package.json`
- Create: `packages/agent/tsconfig.json`
- Create: `packages/casper/package.json`
- Create: `packages/casper/tsconfig.json`

- [x] **Step 1: Create workspace manifests**

Create npm workspaces for `apps/*` and `packages/*`, with scripts:

```json
{
  "scripts": {
    "dev": "npm --workspace apps/web run dev",
    "build": "npm --workspace apps/web run build",
    "test": "npm --workspaces --if-present run test",
    "typecheck": "npm --workspaces --if-present run typecheck"
  },
  "workspaces": ["apps/*", "packages/*"]
}
```

- [x] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and workspace dependencies resolve.

- [x] **Step 3: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.base.json apps packages
git commit -m "chore: scaffold ProofPay workspace"
```

## Task 2: Evidence Agent Package

**Files:**
- Create: `packages/agent/src/types.ts`
- Create: `packages/agent/src/seed-data.ts`
- Create: `packages/agent/src/hash.ts`
- Create: `packages/agent/src/assess.ts`
- Create: `packages/agent/src/index.ts`
- Create: `packages/agent/src/agent.test.ts`

- [x] **Step 1: Write failing tests**

Tests must cover:

```ts
expect(assessEvidence(cleanBundle).decision).toBe("approve");
expect(assessEvidence(amountMismatchBundle).decision).toBe("hold");
expect(assessEvidence(duplicateInvoiceBundle).decision).toBe("reject");
expect(createEvidenceHash(cleanBundle)).toMatch(/^0x[a-f0-9]{64}$/);
```

Run: `npm --workspace @proofpay/agent run test`

Expected: FAIL because implementation files are not complete.

- [x] **Step 2: Implement types and seeded data**

Define `Deal`, `Milestone`, `EvidenceBundle`, `AgentAssessment`, `Decision`, and seeded scenarios named `clean`, `amountMismatch`, and `duplicateInvoice`.

- [x] **Step 3: Implement deterministic scoring**

Implement `assessEvidence(bundle)` so:

- clean evidence approves with confidence at least 90.
- amount mismatch holds with a risk flag containing `amount_mismatch`.
- duplicate invoice rejects with a risk flag containing `duplicate_invoice`.

- [x] **Step 4: Run tests**

Run: `npm --workspace @proofpay/agent run test`

Expected: PASS.

- [x] **Step 5: Commit agent package**

Run:

```bash
git add packages/agent
git commit -m "feat: add deterministic RWA evidence agent"
```

## Task 3: Casper Adapter Package

**Files:**
- Create: `packages/casper/src/types.ts`
- Create: `packages/casper/src/payload.ts`
- Create: `packages/casper/src/demo-adapter.ts`
- Create: `packages/casper/src/index.ts`
- Create: `packages/casper/src/casper.test.ts`

- [x] **Step 1: Write failing tests**

Tests must cover:

```ts
const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
expect(payload.decision).toBe("approve");
expect(payload.decisionHash).toMatch(/^0x[a-f0-9]{64}$/);
const tx = await submitDemoAttestation(payload);
expect(tx.hash).toMatch(/^0x[a-f0-9]{64}$/);
expect(tx.network).toBe("casper-testnet-demo");
```

Run: `npm --workspace @proofpay/casper run test`

Expected: FAIL before implementation.

- [x] **Step 2: Implement payload builder**

Build a normalized payload containing milestone id, evidence hash, decision, confidence, risk score, risk flags, agent id, and ISO timestamp.

- [x] **Step 3: Implement local demo adapter**

Return deterministic transaction-like hashes from payload hashes. Label network as `casper-testnet-demo`, expose `explorerUrl` as `null`, and make UI/documentation clear that this mode does not satisfy the final buildathon eligibility gate by itself.

- [x] **Step 4: Run tests**

Run: `npm --workspace @proofpay/casper run test`

Expected: PASS.

- [x] **Step 5: Commit Casper adapter**

Run:

```bash
git add packages/casper
git commit -m "feat: add Casper attestation adapter"
```

## Task 4: Next.js Product UI

**Files:**
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/DealRail.tsx`
- Create: `apps/web/src/components/EvidencePanel.tsx`
- Create: `apps/web/src/components/AssessmentPanel.tsx`
- Create: `apps/web/src/components/ProofPanel.tsx`

- [x] **Step 1: Build main workflow**

The page must import seeded scenarios, call `assessEvidence`, create an attestation payload, submit a demo transaction, and render the result.

- [x] **Step 2: Build operational dashboard UI**

Use tabs or segmented controls for seeded scenarios, icon buttons from lucide-react, compact panels, status chips, tables, and a proof panel. Avoid landing-page copy and make the first screen the product.

- [x] **Step 3: Add responsive CSS**

Desktop should show a multi-column dashboard. Mobile should stack panels with stable button and table dimensions.

- [x] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

- [x] **Step 5: Commit UI**

Run:

```bash
git add apps/web
git commit -m "feat: build ProofPay dashboard"
```

## Task 5: Contract And Documentation

**Files:**
- Create: `contracts/proofpay-attestation/Cargo.toml`
- Create: `contracts/proofpay-attestation/src/main.rs`
- Create: `contracts/proofpay-attestation/README.md`
- Create: `docs/demo-script.md`
- Create: `docs/submission-checklist.md`
- Create: `docs/casper-testnet.md`
- Create: `README.md`

- [x] **Step 1: Add Odra/Casper contract source**

Create a minimal Casper contract path with Odra-first documentation. If Odra dependencies cannot be installed quickly, include a raw Casper Rust fallback with `#![no_std]`, `#![no_main]`, and `call()` that stores an attestation record under a named key derived from `milestone_id`. The README must explain which path is implemented and how to deploy it to testnet.

- [x] **Step 2: Add submission docs**

Document setup, run commands, demo flow, architecture, DoraHacks BUIDL submission fields, CSPR.fans community voting note, Casper ecosystem alignment, and the testnet deployment path.

- [x] **Step 3: Run docs sanity checks**

Run:

```bash
rg -n "TBD|FIXME" README.md docs/*.md contracts || true
```

Expected: no incomplete markers.

- [x] **Step 4: Commit docs and contract**

Run:

```bash
git add README.md docs contracts
git commit -m "docs: add submission materials and Casper contract"
```

## Task 6: Verification And Delivery

**Files:**
- Modify if needed: app, packages, docs.

- [x] **Step 1: Run automated checks**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run local app**

Run: `npm run dev -- --hostname 127.0.0.1 --port 3000`

Expected: Next.js serves the app at `http://127.0.0.1:3000`.

- [ ] **Step 3: Browser verify**

Use browser automation to verify the dashboard renders, judge-mode scenario buttons work, and desktop/mobile layouts do not overlap.

- [ ] **Step 4: Final commit and push**

If verification required fixes, commit them. Push `main` to `origin`.

Run: `git push origin main`

Expected: GitHub repository contains the working prototype and docs.
