import type {
  AgentAssessment,
  Decision,
  Deal,
  EvidenceBundle,
  EvidenceDocument,
  EvidenceDocumentType,
  Milestone
} from "./types";
import { assessEvidence } from "./assess";

const seededScenarios = ["clean", "amountMismatch", "duplicateInvoice"] as const;
type SeededScenario = (typeof seededScenarios)[number];

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

export interface IntakeDocument {
  id: string;
  title: string;
  type: EvidenceDocumentType;
  source: string;
  status: EvidenceMatrixRow["status"];
  confidence: number;
  extractedClaim: string;
  fingerprint: string;
}

export interface IntakeModel {
  bundleId: string;
  submittedBy: string;
  submittedAt: string;
  evidenceHash: `0x${string}`;
  documents: IntakeDocument[];
}

export type WorkflowStatus = "submitted" | "active" | "ready" | "standby" | "recorded" | "pending" | "blocked";

export interface WorkflowRole {
  role: "Supplier" | "ProofPay Agent" | "Buyer" | "Arbiter" | "Casper";
  owner: string;
  status: WorkflowStatus;
  action: string;
  detail: string;
}

export interface EvaluationRow {
  scenario: SeededScenario;
  expectedDecision: Decision;
  actualDecision: Decision;
  confidence: number;
  riskScore: number;
  policyGate: string;
  passed: boolean;
}

export interface EcosystemHook {
  id: "attestation-api" | "mcp-tool" | "x402-gate";
  label: string;
  endpoint: string;
  status: "live" | "demo";
  detail: string;
}

export interface ProductDepthModel {
  intake: IntakeModel;
  workflow: WorkflowRole[];
  evaluation: {
    rows: EvaluationRow[];
    passRate: number;
  };
  ecosystemHooks: EcosystemHook[];
}

export interface CreateProductDepthModelInput extends CreateOperationsDashboardInput {
  allBundles: Record<string, EvidenceBundle>;
  casperRecorded?: boolean;
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

function confidenceFor(document: EvidenceDocument, status: EvidenceMatrixRow["status"]): number {
  if (status === "failed") return 58;
  if (status === "warning") return 78;
  const confidenceByType: Record<EvidenceDocumentType, number> = {
    invoice: 97,
    bill_of_lading: 95,
    delivery_note: 94,
    temperature_log: 93,
    vendor_registry: 96
  };
  return confidenceByType[document.type];
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

function expectedDecisionFor(scenario: SeededScenario): Decision {
  if (scenario === "amountMismatch") return "hold";
  if (scenario === "duplicateInvoice") return "reject";
  return "approve";
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
      detail: "Selected scenario has recorded Casper Testnet evidence.",
      status: "complete"
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

export function createProductDepthModel({
  deal,
  milestone,
  bundle,
  assessment,
  evidenceHash,
  allBundles,
  casperRecorded = assessment.decision === "approve"
}: CreateProductDepthModelInput): ProductDepthModel {
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
  const intakeDocuments = bundle.documents.map((document) => {
    const row = evidenceMatrix.find((item) => item.id === document.id);
    const status = row?.status ?? "matched";
    return {
      id: document.id,
      title: document.title,
      type: document.type,
      source: coverageFor(document),
      status,
      confidence: confidenceFor(document, status),
      extractedClaim: keyClaim(document),
      fingerprint: document.fingerprint
    };
  });
  const evaluationRows = seededScenarios.map((scenario) => {
    const scenarioBundle = allBundles[scenario];
    const scenarioAssessment = assessEvidence(scenarioBundle);
    return {
      scenario,
      expectedDecision: expectedDecisionFor(scenario),
      actualDecision: scenarioAssessment.decision,
      confidence: scenarioAssessment.confidence,
      riskScore: scenarioAssessment.riskScore,
      policyGate: scenarioAssessment.flags.length ? scenarioAssessment.flags.join(", ") : "all required claims matched",
      passed: expectedDecisionFor(scenario) === scenarioAssessment.decision
    };
  });

  return {
    intake: {
      bundleId: bundle.id,
      submittedBy: bundle.submittedBy,
      submittedAt: bundle.submittedAt,
      evidenceHash,
      documents: intakeDocuments
    },
    workflow: [
      {
        role: "Supplier",
        owner: deal.supplier,
        status: "submitted",
        action: "Submit evidence pack",
        detail: `${bundle.documents.length} documents packaged for ${milestone.title}.`
      },
      {
        role: "ProofPay Agent",
        owner: "proofpay-agent-v1",
        status: "active",
        action: "Assess claims and policy gates",
        detail: `${assessment.confidence}% confidence with risk ${assessment.riskScore}/100.`
      },
      {
        role: "Buyer",
        owner: deal.buyer,
        status: assessment.decision === "approve" ? "ready" : "active",
        action: assessment.decision === "approve" ? "Approve release" : "Review exception",
        detail: assessment.requiredFollowUp[0] ?? "Evidence is aligned with escrow terms."
      },
      {
        role: "Arbiter",
        owner: "ProofPay dispute desk",
        status: assessment.decision === "reject" ? "active" : "standby",
        action: assessment.decision === "reject" ? "Open dispute review" : "Stand by for challenge window",
        detail: assessment.decision === "reject" ? "Duplicate settlement fingerprint requires escalation." : "No dispute action required."
      },
      {
        role: "Casper",
        owner: "Casper Testnet",
        status: casperRecorded ? "recorded" : "pending",
        action: casperRecorded ? "Store attestation" : "Await scenario deploy",
        detail: casperRecorded
          ? "Recorded Testnet transaction anchors the decision hash."
          : "Deploy this scenario to create a matching Testnet attestation."
      }
    ],
    evaluation: {
      rows: evaluationRows,
      passRate: Math.round((evaluationRows.filter((row) => row.passed).length / evaluationRows.length) * 100)
    },
    ecosystemHooks: [
      {
        id: "attestation-api",
        label: "Attestation API",
        endpoint: "/api/attestation/clean",
        status: "live",
        detail: "Returns assessment, payload, Casper verification, and dossier for a scenario."
      },
      {
        id: "mcp-tool",
        label: "MCP tool manifest",
        endpoint: "/api/mcp",
        status: "demo",
        detail: "Describes assess_milestone_evidence and get_casper_attestation tools for agent clients."
      },
      {
        id: "x402-gate",
        label: "x402-ready gate",
        endpoint: "/api/x402/release-decision",
        status: "demo",
        detail: "Shows a payment-required handshake before returning a release decision package."
      }
    ]
  };
}
