import type {
  AgentAssessment,
  Deal,
  EvidenceBundle,
  EvidenceDocument,
  EvidenceDocumentType,
  Milestone
} from "./types";

export type OperationsTone = "positive" | "warning" | "negative" | "neutral";

export interface CockpitMetric {
  id: "release" | "risk" | "confidence" | "evidence" | "chain";
  label: string;
  value: string;
  sub: string;
  tone: OperationsTone;
}

export interface EvidenceMatrixRow {
  id: string;
  documentType: EvidenceDocumentType;
  title: string;
  fingerprint: string;
  issuedAt: string;
  status: "matched" | "warning" | "failed";
  coverage: string;
  keyClaim: string;
}

export interface ActionQueueItem {
  id: string;
  title: string;
  detail: string;
  status: "ready" | "watch" | "blocked";
}

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
  detail: string;
  status: "complete" | "active" | "pending";
}

export interface OperationsDashboardModel {
  cockpitMetrics: CockpitMetric[];
  evidenceMatrix: EvidenceMatrixRow[];
  actionQueue: ActionQueueItem[];
  timeline: TimelineEvent[];
  chartSeries: {
    temperature: Array<{ checkpoint: string; minC: number; maxC: number; lowerBound: number; upperBound: number }>;
    risk: Array<{ stage: string; score: number }>;
    cashflow: Array<{ stage: string; locked: number; releaseReady: number; disputed: number }>;
    evidenceCoverage: Array<{ type: string; score: number }>;
  };
}

export interface CreateOperationsDashboardInput {
  deal: Deal;
  milestone: Milestone;
  bundle: EvidenceBundle;
  assessment: AgentAssessment;
  evidenceHash: `0x${string}`;
}

function money(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

function decisionTone(decision: AgentAssessment["decision"]): OperationsTone {
  if (decision === "approve") return "positive";
  if (decision === "hold") return "warning";
  return "negative";
}

function documentStatus(document: EvidenceDocument, assessment: AgentAssessment): EvidenceMatrixRow["status"] {
  const related = assessment.extractedClaims.filter((claim) => claim.source === document.title);
  if (related.some((claim) => claim.status === "failed")) return "failed";
  if (related.some((claim) => claim.status === "warning")) return "warning";
  return "matched";
}

function keyClaim(document: EvidenceDocument): string {
  if (document.claims.amount !== undefined) {
    return `${document.claims.currency ?? ""} ${document.claims.amount.toLocaleString("en-US")}`.trim();
  }
  if (document.claims.temperatureMinC !== undefined && document.claims.temperatureMaxC !== undefined) {
    return `${document.claims.temperatureMinC}C to ${document.claims.temperatureMaxC}C`;
  }
  return document.claims.shipmentId ?? document.claims.supplier ?? document.claims.signedBy ?? "registry clear";
}

function coverageFor(document: EvidenceDocument): string {
  const labels: Record<EvidenceDocumentType, string> = {
    invoice: "commercial terms",
    bill_of_lading: "shipment identity",
    delivery_note: "receiver acceptance",
    temperature_log: "cold-chain telemetry",
    vendor_registry: "counterparty registry"
  };
  return labels[document.type];
}

function buildTemperatureSeries(bundle: EvidenceBundle): OperationsDashboardModel["chartSeries"]["temperature"] {
  const log = bundle.documents.find((document) => document.type === "temperature_log");
  const minC = log?.claims.temperatureMinC ?? bundle.expected.temperatureMinC;
  const maxC = log?.claims.temperatureMaxC ?? bundle.expected.temperatureMaxC;
  const spread = Math.max(0.4, (maxC - minC) / 4);
  return Array.from({ length: 8 }, (_, index) => {
    const wave = Math.sin(index / 1.7) * spread;
    return {
      checkpoint: `T+${index * 3}h`,
      minC: Number(Math.max(minC, minC + wave * 0.35).toFixed(1)),
      maxC: Number(Math.min(maxC, maxC - wave * 0.25).toFixed(1)),
      lowerBound: bundle.expected.temperatureMinC,
      upperBound: bundle.expected.temperatureMaxC
    };
  });
}

function buildRiskSeries(assessment: AgentAssessment): OperationsDashboardModel["chartSeries"]["risk"] {
  return [
    { stage: "submitted", score: 35 },
    { stage: "extracted", score: Math.max(18, assessment.riskScore + (assessment.decision === "approve" ? 10 : -6)) },
    { stage: "assessed", score: assessment.riskScore }
  ];
}

function buildCashflowSeries(milestone: Milestone, assessment: AgentAssessment): OperationsDashboardModel["chartSeries"]["cashflow"] {
  return [
    { stage: "escrowed", locked: milestone.amount, releaseReady: 0, disputed: 0 },
    {
      stage: "agent review",
      locked: milestone.amount,
      releaseReady: assessment.decision === "approve" ? milestone.amount * 0.66 : 0,
      disputed: assessment.decision === "hold" ? milestone.amount * 0.2 : 0
    },
    {
      stage: "attestation",
      locked: assessment.decision === "approve" ? 0 : milestone.amount,
      releaseReady: assessment.decision === "approve" ? milestone.amount : 0,
      disputed: assessment.decision === "reject" ? milestone.amount : assessment.decision === "hold" ? milestone.amount * 0.28 : 0
    }
  ];
}

function buildEvidenceCoverage(rows: EvidenceMatrixRow[]): OperationsDashboardModel["chartSeries"]["evidenceCoverage"] {
  return rows.map((row) => ({
    type: row.documentType.replaceAll("_", " "),
    score: row.status === "matched" ? 100 : row.status === "warning" ? 68 : 34
  }));
}

function buildActionQueue(assessment: AgentAssessment): ActionQueueItem[] {
  if (assessment.decision === "approve") {
    return [
      {
        id: "release",
        title: "Release milestone payment",
        detail: "Evidence is aligned and Casper attestation is ready for judge review.",
        status: "ready"
      },
      {
        id: "monitor",
        title: "Monitor post-attestation dispute window",
        detail: "Keep the evidence hash and decision hash visible for buyer and supplier audit.",
        status: "watch"
      }
    ];
  }

  return assessment.requiredFollowUp.map((item, index) => ({
    id: `follow-up-${index + 1}`,
    title: item.toLowerCase().includes("finance") ? "Route to buyer finance" : item.split(".")[0],
    detail: item,
    status: assessment.decision === "reject" ? "blocked" : "watch"
  }));
}

function buildTimeline(bundle: EvidenceBundle, assessment: AgentAssessment, evidenceHash: string): TimelineEvent[] {
  return [
    {
      id: "submitted",
      label: "Evidence submitted",
      timestamp: bundle.submittedAt,
      detail: `${bundle.documents.length} documents received from ${bundle.submittedBy}.`,
      status: "complete"
    },
    {
      id: "hashed",
      label: "Evidence hash sealed",
      timestamp: bundle.submittedAt,
      detail: evidenceHash,
      status: "complete"
    },
    {
      id: "assessed",
      label: "Agent assessment",
      timestamp: assessment.assessedAt,
      detail: `${assessment.decision} with ${assessment.confidence}% confidence.`,
      status: "active"
    },
    {
      id: "casper",
      label: "Casper attestation",
      timestamp: assessment.assessedAt,
      detail: assessment.decision === "approve" ? "Clean scenario has recorded Testnet evidence." : "Scenario can be deployed with the printed Casper command.",
      status: assessment.decision === "approve" ? "complete" : "pending"
    }
  ];
}

export function createOperationsDashboard({
  deal,
  milestone,
  bundle,
  assessment,
  evidenceHash
}: CreateOperationsDashboardInput): OperationsDashboardModel {
  const evidenceMatrix = bundle.documents.map((document) => ({
    id: document.id,
    documentType: document.type,
    title: document.title,
    fingerprint: document.fingerprint,
    issuedAt: document.issuedAt,
    status: documentStatus(document, assessment),
    coverage: coverageFor(document),
    keyClaim: keyClaim(document)
  }));
  const matchedCount = evidenceMatrix.filter((row) => row.status === "matched").length;

  return {
    cockpitMetrics: [
      {
        id: "release",
        label: "Release readiness",
        value: assessment.decision === "approve" ? money(deal.currency, milestone.amount) : assessment.decision.toUpperCase(),
        sub: assessment.decision === "approve" ? "ready for payment release" : "manual review before release",
        tone: decisionTone(assessment.decision)
      },
      {
        id: "risk",
        label: "Risk score",
        value: `${assessment.riskScore}/100`,
        sub: assessment.flags.length ? assessment.flags.join(", ") : "no risk flags",
        tone: assessment.riskScore < 30 ? "positive" : assessment.riskScore < 75 ? "warning" : "negative"
      },
      {
        id: "confidence",
        label: "Agent confidence",
        value: `${assessment.confidence}%`,
        sub: assessment.policyVersion,
        tone: assessment.confidence >= 90 ? "positive" : "warning"
      },
      {
        id: "evidence",
        label: "Evidence coverage",
        value: `${matchedCount}/${evidenceMatrix.length}`,
        sub: "documents matched",
        tone: matchedCount === evidenceMatrix.length ? "positive" : "warning"
      },
      {
        id: "chain",
        label: "Casper anchor",
        value: evidenceHash.slice(0, 10),
        sub: "evidence hash ready",
        tone: "positive"
      }
    ],
    evidenceMatrix,
    actionQueue: buildActionQueue(assessment),
    timeline: buildTimeline(bundle, assessment, evidenceHash),
    chartSeries: {
      temperature: buildTemperatureSeries(bundle),
      risk: buildRiskSeries(assessment),
      cashflow: buildCashflowSeries(milestone, assessment),
      evidenceCoverage: buildEvidenceCoverage(evidenceMatrix)
    }
  };
}
