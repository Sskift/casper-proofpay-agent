# Audit Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a judge-facing Audit Dossier that makes ProofPay's evidence, reasoning, hashes, and Casper proof inspectable from one UI section.

**Architecture:** Add dossier domain types and a deterministic `createAuditDossier` function to `packages/agent`, then render that model in a new dashboard section. Keep Casper-specific values passed in from the web app so the agent package stays independent from `@proofpay/casper`.

**Tech Stack:** TypeScript, Vitest, Next.js app router, React, HeroUI, lucide-react, existing CSS dashboard system.

---

## File Map

- Modify `packages/agent/src/types.ts`: add portable dossier and trace interfaces.
- Create `packages/agent/src/audit-dossier.ts`: build the deterministic dossier model from existing deal, bundle, assessment, and Casper proof values.
- Modify `packages/agent/src/index.ts`: export dossier types and function.
- Modify `packages/agent/src/agent.test.ts`: add dossier TDD coverage.
- Modify `apps/web/src/app/page.tsx`: import `createAuditDossier`, add `dossier` sidebar section, and render `DossierSection`.
- Modify `apps/web/src/app/globals.css`: style dossier summary, trace, JSON, and checklist panels.
- Modify `apps/web/scripts/check-dashboard-layout.mjs`: require the new Dossier section.
- Modify `README.md` and `docs/buidl-submission-brief.md`: document the Audit Dossier.

## Task 1: Agent Dossier Model

**Files:**
- Modify: `packages/agent/src/types.ts`
- Create: `packages/agent/src/audit-dossier.ts`
- Modify: `packages/agent/src/index.ts`
- Test: `packages/agent/src/agent.test.ts`

- [ ] **Step 1: Write failing dossier tests**

Add tests to `packages/agent/src/agent.test.ts` that import `createAuditDossier` and assert:

```ts
it("builds a clean audit dossier with Casper proof facts", () => {
  const deal = seededDeals[0];
  const milestone = deal.milestones[0];
  const bundle = seededEvidenceBundles.clean;
  const assessment = assessEvidence(bundle);
  const evidenceHash = createEvidenceHash(bundle);

  const dossier = createAuditDossier({
    deal,
    milestone,
    bundle,
    assessment,
    evidenceHash,
    decisionHash: "0xdecision",
    casper: {
      network: "casper-testnet",
      transactionHash: "0xtx",
      blockHeight: 8282603,
      namedKey: "proofpay_attestation_ms-delivery-acceptance",
      storedURef: "uref-proof-007"
    },
    localTransactionHash: "0xlocal",
    cliCommand: "casper-client put-deploy ..."
  });

  expect(dossier.decision).toBe("approve");
  expect(dossier.releaseAmount).toBe("USD 42,000");
  expect(dossier.verification.casperTransactionHash).toBe("0xtx");
  expect(dossier.trace.every((step) => step.status === "passed")).toBe(true);
  expect(JSON.stringify(dossier)).toContain("proofpay_attestation_ms-delivery-acceptance");
});
```

Add a second test for `amountMismatch` requiring a failed `invoice-amount` trace step and a finance checklist item. Add a third test for `duplicateInvoice` requiring a failed `duplicate-invoice` trace step and `reject`.

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm --workspace packages/agent run test
```

Expected: FAIL because `createAuditDossier` is not exported.

- [ ] **Step 3: Implement dossier types and builder**

Add types in `types.ts`:

```ts
export type AuditTraceStatus = "passed" | "warning" | "failed" | "pending";

export interface AuditTraceStep {
  id: string;
  label: string;
  expected: string;
  observed: string;
  status: AuditTraceStatus;
  impact: string;
  sources: string[];
}

export interface AuditDossier {
  id: string;
  scenario: EvidenceBundle["scenario"];
  decision: Decision;
  confidence: number;
  riskScore: number;
  policyVersion: string;
  releaseAmount: string;
  generatedAt: string;
  verification: {
    evidenceHash: `0x${string}`;
    decisionHash: `0x${string}` | string;
    localTransactionHash?: string;
    network: string;
    casperTransactionHash?: string;
    blockHeight?: number;
    namedKey?: string;
    storedURef?: string;
    cliCommand: string;
  };
  trace: AuditTraceStep[];
  reviewChecklist: string[];
}
```

Implement `audit-dossier.ts` with helpers for formatting money, finding documents, formatting observed values, and mapping flags to trace statuses. Export it through `index.ts`.

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
npm --workspace packages/agent run test
```

Expected: PASS.

## Task 2: Web Dossier Section

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/scripts/check-dashboard-layout.mjs`

- [ ] **Step 1: Write failing layout smoke check**

Update `apps/web/scripts/check-dashboard-layout.mjs` to require:

```js
["cockpit", "charts", "evidence", "casper", "dossier"]
```

and require the visible text `Audit dossier`.

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm --workspace apps/web run test
```

Expected: FAIL because `dossier` is missing.

- [ ] **Step 3: Add Dossier section**

In `page.tsx`:

- Import `createAuditDossier` and `type AuditDossier`.
- Extend `SectionId` with `"dossier"`.
- Add a fifth sidebar section.
- Build `dossier` with `useMemo` after `deployPlan`.
- Add `DossierSection` after `CasperSection`.
- Render trace cards, verification facts, JSON package, and checklist.

- [ ] **Step 4: Add CSS**

In `globals.css`, add `.dossier-grid`, `.dossier-summary`, `.trace-grid`, `.trace-card`, `.dossier-json`, `.checklist-panel`, and responsive rules matching the existing 8px card radius and neutral dashboard palette.

- [ ] **Step 5: Run web smoke test**

Run:

```bash
npm --workspace apps/web run test
```

Expected: PASS.

## Task 3: Docs And Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/buidl-submission-brief.md`

- [ ] **Step 1: Update docs**

Mention that ProofPay now includes an Audit Dossier section that packages reasoning trace, hashes, Casper proof facts, and reproducibility checklist.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run test
npm run typecheck
npm run build
npm run submission:check
```

Expected: all pass. `submission:check` may warn about ignored local artifacts, but must end with `Submission clean check passed.`

- [ ] **Step 3: Commit and push**

Run:

```bash
git add packages/agent/src/types.ts packages/agent/src/audit-dossier.ts packages/agent/src/index.ts packages/agent/src/agent.test.ts apps/web/src/app/page.tsx apps/web/src/app/globals.css apps/web/scripts/check-dashboard-layout.mjs README.md docs/buidl-submission-brief.md
git commit -m "feat: add audit dossier workbench"
git push origin main
```

Expected: GitHub `main` contains the Audit Dossier iteration.

## Self-Review

- Spec coverage: The plan covers domain model, reasoning trace, frontend section, layout smoke check, docs, verification, commit, and push.
- Placeholder scan: No unfinished placeholder markers remain.
- Type consistency: `AuditDossier`, `AuditTraceStep`, `createAuditDossier`, and `dossier` names are consistent across tasks.
