import type { AgentAssessment, Decision, Milestone, RiskFlag } from "@proofpay/agent";

export interface CreateAttestationPayloadInput {
  milestone: Milestone;
  evidenceHash: `0x${string}`;
  assessment: AgentAssessment;
  agentId?: string;
}

export interface CasperAttestationPayload {
  schemaVersion: "proofpay.attestation.v1";
  attestationId: string;
  milestoneId: string;
  dealId: string;
  evidenceHash: `0x${string}`;
  decision: Decision;
  decisionHash: `0x${string}`;
  confidence: number;
  riskScore: number;
  riskFlags: RiskFlag[];
  agentId: string;
  assessedAt: string;
  amount: number;
  currency: string;
}

export interface DemoCasperTransaction {
  hash: `0x${string}`;
  network: "casper-testnet-demo";
  status: "accepted";
  submittedAt: string;
  explorerUrl: null;
  payload: CasperAttestationPayload;
}
