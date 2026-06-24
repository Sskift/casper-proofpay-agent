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

export interface CreateCasperDeployPlanInput {
  payload: CasperAttestationPayload;
  scenario: string;
  nodeAddress?: string;
  chainName?: string;
  secretKeyPath?: string;
  wasmPath?: string;
  paymentAmount?: string;
  gasPriceTolerance?: string;
  publicKeyHex?: string;
  accountHash?: string;
  faucetUrl?: string;
  testnetAccountFunded?: boolean;
}

export type CasperReadinessStatus = "ready" | "blocked" | "manual";

export interface CasperReadinessItem {
  id: "payload" | "contract" | "testnet-account" | "testnet-deploy" | "buidl";
  label: string;
  status: CasperReadinessStatus;
  detail: string;
}

export interface CasperDeploymentRecord {
  transactionHash: string;
  blockHash: string;
  blockHeight: number;
  publicKeyHex: string;
  accountHash: string;
  namedKey: string;
  uref: string;
  milestoneId: string;
  evidenceHash: `0x${string}`;
  decision: Decision;
  decisionHash: `0x${string}`;
  confidence: number;
  riskScore: number;
  submittedAt: string;
}

export type CasperVerificationState = "recorded" | "pending" | "blocked";

export interface CasperVerificationSummary {
  state: CasperVerificationState;
  label: string;
  detail: string;
  network: CasperDeployPlan["network"];
  primaryHash: string;
  checkedAt: string;
}

export interface CasperDeployPlan {
  network: "Casper Testnet";
  nodeAddress: string;
  chainName: string;
  wasmPath: string;
  paymentAmount: string;
  gasPriceTolerance: string;
  secretKeyPath: string;
  publicKeyHex: string;
  accountHash: string;
  faucetUrl: string;
  readiness: CasperReadinessItem[];
  deployment: CasperDeploymentRecord | null;
  sessionArgs: string[];
  cliCommand: string;
  postFundingCommands: string[];
}
