import { describe, expect, it } from "vitest";

import {
  assessEvidence,
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
});
