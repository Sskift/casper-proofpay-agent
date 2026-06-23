export type Decision = "approve" | "hold" | "reject";

export type RiskFlag =
  | "amount_mismatch"
  | "currency_mismatch"
  | "duplicate_invoice"
  | "missing_delivery_confirmation"
  | "temperature_excursion"
  | "counterparty_mismatch";

export type EvidenceDocumentType =
  | "invoice"
  | "bill_of_lading"
  | "delivery_note"
  | "temperature_log"
  | "vendor_registry";

export interface Deal {
  id: string;
  name: string;
  buyer: string;
  supplier: string;
  assetType: string;
  jurisdiction: string;
  escrowAmount: number;
  currency: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  dealId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  state: "awaiting_evidence" | "under_agent_review" | "attested";
  requiredEvidence: EvidenceDocumentType[];
}

export interface EvidenceClaims {
  invoiceId?: string;
  purchaseOrder?: string;
  buyer?: string;
  supplier?: string;
  amount?: number;
  currency?: string;
  shipmentId?: string;
  assetDescription?: string;
  deliveredAt?: string;
  deliveryLocation?: string;
  signedBy?: string;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  duplicateOf?: string;
}

export interface EvidenceDocument {
  id: string;
  type: EvidenceDocumentType;
  title: string;
  issuedAt: string;
  fingerprint: string;
  claims: EvidenceClaims;
}

export interface EvidenceExpectation {
  buyer: string;
  supplier: string;
  amount: number;
  currency: string;
  shipmentId: string;
  temperatureMinC: number;
  temperatureMaxC: number;
}

export interface EvidenceBundle {
  id: string;
  dealId: string;
  milestoneId: string;
  scenario: "clean" | "amountMismatch" | "duplicateInvoice";
  submittedBy: string;
  submittedAt: string;
  summary: string;
  expected: EvidenceExpectation;
  documents: EvidenceDocument[];
}

export interface ExtractedClaim {
  label: string;
  value: string;
  source: string;
  status: "matched" | "warning" | "failed";
}

export interface AgentAssessment {
  id: string;
  bundleId: string;
  decision: Decision;
  confidence: number;
  riskScore: number;
  flags: RiskFlag[];
  reasons: string[];
  requiredFollowUp: string[];
  extractedClaims: ExtractedClaim[];
  policyVersion: string;
  assessedAt: string;
}
