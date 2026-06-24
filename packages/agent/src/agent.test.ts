import { describe, expect, it } from "vitest";

import {
  assessEvidence,
  createAuditDossier,
  createOperationsDashboard,
  createEvidenceHash,
  seededDeals,
  seededEvidenceBundles
} from "./index";

describe("ProofPay evidence agent", () => {
  it("approves clean delivery evidence with high confidence", () => {
    const assessment = assessEvidence(seededEvidenceBundles.clean);

    expect(assessment.decision).toBe("approve");
    expect(assessment.confidence).toBeGreaterThanOrEqual(90);
    expect(assessment.riskScore).toBeLessThan(20);
    expect(assessment.reasons.join(" ")).toContain("invoice, delivery note, and bill of lading align");
  });

  it("holds payment when invoice amount does not match the milestone", () => {
    const assessment = assessEvidence(seededEvidenceBundles.amountMismatch);

    expect(assessment.decision).toBe("hold");
    expect(assessment.flags).toContain("amount_mismatch");
    expect(assessment.requiredFollowUp).toContain("Confirm the final invoice amount with buyer finance.");
  });

  it("rejects a duplicated invoice fingerprint", () => {
    const assessment = assessEvidence(seededEvidenceBundles.duplicateInvoice);

    expect(assessment.decision).toBe("reject");
    expect(assessment.flags).toContain("duplicate_invoice");
    expect(assessment.riskScore).toBeGreaterThanOrEqual(80);
  });

  it("creates stable evidence hashes suitable for Casper attestations", () => {
    const firstHash = createEvidenceHash(seededEvidenceBundles.clean);
    const secondHash = createEvidenceHash(seededEvidenceBundles.clean);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("ships the seeded RWA deal expected by the judge-mode demo", () => {
    expect(seededDeals[0]?.assetType).toBe("Temperature-controlled vaccine shipment");
    expect(seededDeals[0]?.milestones[0]?.amount).toBe(42000);
  });

  it("builds an operations dashboard model with cockpit metrics and chart series", () => {
    const deal = seededDeals[0];
    const milestone = deal.milestones[0];
    const bundle = seededEvidenceBundles.clean;
    const assessment = assessEvidence(bundle);
    const evidenceHash = createEvidenceHash(bundle);

    const model = createOperationsDashboard({ deal, milestone, bundle, assessment, evidenceHash });

    expect(model.cockpitMetrics.map((metric) => metric.id)).toEqual([
      "release",
      "risk",
      "confidence",
      "evidence",
      "chain"
    ]);
    expect(model.cockpitMetrics.find((metric) => metric.id === "release")?.value).toBe("USD 42,000");
    expect(model.evidenceMatrix).toHaveLength(bundle.documents.length);
    expect(model.evidenceMatrix.every((row) => row.status === "matched")).toBe(true);
    expect(model.chartSeries.temperature).toHaveLength(8);
    expect(model.chartSeries.risk).toHaveLength(3);
    expect(model.actionQueue[0]?.status).toBe("ready");
  });

  it("surfaces finance review actions and failed evidence rows for amount mismatch", () => {
    const deal = seededDeals[0];
    const milestone = deal.milestones[0];
    const bundle = seededEvidenceBundles.amountMismatch;
    const assessment = assessEvidence(bundle);
    const evidenceHash = createEvidenceHash(bundle);

    const model = createOperationsDashboard({ deal, milestone, bundle, assessment, evidenceHash });

    expect(model.cockpitMetrics.find((metric) => metric.id === "release")?.tone).toBe("warning");
    expect(model.evidenceMatrix.find((row) => row.documentType === "invoice")?.status).toBe("failed");
    expect(model.actionQueue.map((item) => item.title).join(" ")).toContain("finance");
    expect(model.chartSeries.risk.at(-1)?.score).toBe(assessment.riskScore);
  });

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
    expect(dossier.generatedAt).toBe(assessment.assessedAt);
    expect(dossier.verification.casperTransactionHash).toBe("0xtx");
    expect(dossier.trace.every((step) => step.status === "passed")).toBe(true);
    expect(JSON.stringify(dossier)).toContain("proofpay_attestation_ms-delivery-acceptance");
  });

  it("builds a finance-review audit dossier for amount mismatch", () => {
    const deal = seededDeals[0];
    const milestone = deal.milestones[0];
    const bundle = seededEvidenceBundles.amountMismatch;
    const assessment = assessEvidence(bundle);
    const evidenceHash = createEvidenceHash(bundle);

    const dossier = createAuditDossier({
      deal,
      milestone,
      bundle,
      assessment,
      evidenceHash,
      decisionHash: "0xdecision-hold",
      casper: {
        network: "casper-testnet"
      },
      cliCommand: "casper-client put-deploy ..."
    });

    expect(dossier.decision).toBe("hold");
    expect(dossier.trace.find((step) => step.id === "invoice-amount")?.status).toBe("failed");
    expect(dossier.trace.find((step) => step.id === "casper-attestation")?.status).toBe("pending");
    expect(dossier.reviewChecklist.join(" ")).toContain("buyer finance");
  });

  it("builds a rejection audit dossier for duplicate invoices", () => {
    const deal = seededDeals[0];
    const milestone = deal.milestones[0];
    const bundle = seededEvidenceBundles.duplicateInvoice;
    const assessment = assessEvidence(bundle);
    const evidenceHash = createEvidenceHash(bundle);

    const dossier = createAuditDossier({
      deal,
      milestone,
      bundle,
      assessment,
      evidenceHash,
      decisionHash: "0xdecision-reject",
      casper: {
        network: "casper-testnet"
      },
      cliCommand: "casper-client put-deploy ..."
    });

    expect(dossier.decision).toBe("reject");
    expect(dossier.riskScore).toBeGreaterThan(80);
    expect(dossier.trace.find((step) => step.id === "duplicate-invoice")?.status).toBe("failed");
    expect(dossier.reviewChecklist.join(" ")).toContain("fraud review");
  });
});
