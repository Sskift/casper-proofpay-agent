import { assessEvidence, createEvidenceHash, seededDeals, seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import { createAttestationPayload, submitDemoAttestation } from "./index";

describe("ProofPay Casper adapter", () => {
  it("creates hashable attestation payloads from agent assessments", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);

    const payload = createAttestationPayload({
      milestone,
      evidenceHash,
      assessment
    });

    expect(payload.milestoneId).toBe("ms-delivery-acceptance");
    expect(payload.decision).toBe("approve");
    expect(payload.confidence).toBeGreaterThanOrEqual(90);
    expect(payload.decisionHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(payload.agentId).toBe("proofpay-agent-v1");
  });

  it("submits deterministic demo transactions labeled as Casper testnet demo", async () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });

    const first = await submitDemoAttestation(payload);
    const second = await submitDemoAttestation(payload);

    expect(first.hash).toBe(second.hash);
    expect(first.hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.network).toBe("casper-testnet-demo");
    expect(first.explorerUrl).toBeNull();
    expect(first.status).toBe("accepted");
  });
});
