import type { CasperAttestationPayload, CreateAttestationPayloadInput } from "./types";
import { hashObject } from "./hash";

export function createAttestationPayload({
  milestone,
  evidenceHash,
  assessment,
  agentId = "proofpay-agent-v1"
}: CreateAttestationPayloadInput): CasperAttestationPayload {
  const decisionMaterial = {
    milestoneId: milestone.id,
    evidenceHash,
    decision: assessment.decision,
    confidence: assessment.confidence,
    riskScore: assessment.riskScore,
    riskFlags: assessment.flags,
    policyVersion: assessment.policyVersion,
    assessedAt: assessment.assessedAt
  };

  return {
    schemaVersion: "proofpay.attestation.v1",
    attestationId: `att-${milestone.id}-${assessment.id}`,
    milestoneId: milestone.id,
    dealId: milestone.dealId,
    evidenceHash,
    decision: assessment.decision,
    decisionHash: hashObject(decisionMaterial),
    confidence: assessment.confidence,
    riskScore: assessment.riskScore,
    riskFlags: assessment.flags,
    agentId,
    assessedAt: assessment.assessedAt,
    amount: milestone.amount,
    currency: milestone.currency
  };
}
