import type { AgentAssessment, AuditDossier, Deal, EvidenceBundle, Milestone } from "./types";

export type SettlementActor = "supplier" | "agent" | "buyer" | "arbiter" | "casper";
export type SettlementActionStatus = "complete" | "available" | "required" | "blocked";
export type SettlementMode = "auto_release_ready" | "human_review_required" | "release_blocked";

export interface SettlementAction {
  id: string;
  actor: SettlementActor;
  label: string;
  status: SettlementActionStatus;
  detail: string;
  evidence: string;
}

export interface ProductionReadinessItem {
  id: "evidence" | "policy" | "approval" | "casper" | "audit";
  label: string;
  status: "ready" | "manual" | "blocked";
  detail: string;
}

export interface SettlementRunbook {
  mode: SettlementMode;
  headline: string;
  operatorDecision: string;
  releaseAmount: string;
  realWorldUseCase: string;
  actions: SettlementAction[];
  readiness: ProductionReadinessItem[];
}

export interface CreateSettlementRunbookInput {
  deal: Deal;
  milestone: Milestone;
  bundle: EvidenceBundle;
  assessment: AgentAssessment;
  dossier: AuditDossier;
}

function money(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

function modeFor(assessment: AgentAssessment): SettlementMode {
  if (assessment.decision === "approve") return "auto_release_ready";
  if (assessment.decision === "hold") return "human_review_required";
  return "release_blocked";
}

function headlineFor(mode: SettlementMode): string {
  if (mode === "auto_release_ready") return "Release can move after buyer signature.";
  if (mode === "human_review_required") return "Release pauses for targeted human review.";
  return "Release is blocked until dispute resolution.";
}

function buyerActionFor(input: CreateSettlementRunbookInput): SettlementAction {
  const { assessment, dossier } = input;

  if (assessment.decision === "approve") {
    return {
      id: "buyer-release",
      actor: "buyer",
      label: "Sign milestone release",
      status: "available",
      detail: "Buyer can approve payment using the evidence hash, decision hash, and Casper attestation.",
      evidence: dossier.verification.casperTransactionHash ?? dossier.verification.evidenceHash
    };
  }

  if (assessment.decision === "hold") {
    return {
      id: "buyer-finance-review",
      actor: "buyer",
      label: "Resolve finance exception",
      status: "required",
      detail: assessment.requiredFollowUp[0] ?? "Buyer finance must resolve the exception before release.",
      evidence: dossier.trace.find((step) => step.status === "failed")?.observed ?? "invoice variance"
    };
  }

  return {
    id: "buyer-block-release",
    actor: "buyer",
    label: "Keep funds locked",
    status: "blocked",
    detail: "Payment release is blocked because the invoice appears to duplicate a prior settlement.",
    evidence: dossier.trace.find((step) => step.id === "duplicate-invoice")?.observed ?? "duplicate fingerprint"
  };
}

export function createSettlementRunbook(input: CreateSettlementRunbookInput): SettlementRunbook {
  const { deal, milestone, bundle, assessment, dossier } = input;
  const mode = modeFor(assessment);
  const casperRecorded = Boolean(dossier.verification.casperTransactionHash && dossier.verification.storedURef);
  const failedTrace = dossier.trace.filter((step) => step.status === "failed");

  return {
    mode,
    headline: headlineFor(mode),
    operatorDecision:
      assessment.decision === "approve"
        ? "release after signature"
        : assessment.decision === "hold"
          ? "hold and route exception"
          : "block release and open dispute",
    releaseAmount: money(milestone.currency, milestone.amount),
    realWorldUseCase: `${deal.assetType} on the ${deal.jurisdiction} lane, submitted by ${bundle.submittedBy}.`,
    actions: [
      {
        id: "supplier-submit",
        actor: "supplier",
        label: "Submit evidence pack",
        status: "complete",
        detail: `${bundle.documents.length} source documents are sealed into ${dossier.verification.evidenceHash}.`,
        evidence: bundle.id
      },
      {
        id: "agent-assess",
        actor: "agent",
        label: "Assess release policy",
        status: "complete",
        detail: `${assessment.decision} decision with ${assessment.confidence}% confidence and risk ${assessment.riskScore}/100.`,
        evidence: assessment.policyVersion
      },
      buyerActionFor(input),
      {
        id: "arbiter-window",
        actor: "arbiter",
        label: assessment.decision === "reject" ? "Open dispute case" : "Monitor challenge window",
        status: assessment.decision === "reject" ? "required" : "available",
        detail:
          assessment.decision === "reject"
            ? "Arbiter reviews duplicate settlement evidence before funds can move."
            : "Arbiter can replay the dossier if either party challenges the decision.",
        evidence: failedTrace.map((step) => step.id).join(", ") || "no failed trace"
      },
      {
        id: "casper-anchor",
        actor: "casper",
        label: "Verify on-chain attestation",
        status: casperRecorded ? "complete" : "required",
        detail: casperRecorded
          ? "Casper transaction, named key, and stored URef anchor the decision."
          : "Deploy the payload before representing this scenario as on-chain verified.",
        evidence: dossier.verification.casperTransactionHash ?? dossier.verification.cliCommand
      }
    ],
    readiness: [
      {
        id: "evidence",
        label: "Evidence pack",
        status: failedTrace.length === 0 ? "ready" : "manual",
        detail: failedTrace.length === 0 ? "All core trace checks passed." : `${failedTrace.length} trace checks need review.`
      },
      {
        id: "policy",
        label: "Policy trace",
        status: "ready",
        detail: `${dossier.trace.length} trace cards explain expected value, observed value, and impact.`
      },
      {
        id: "approval",
        label: "Human release control",
        status: assessment.decision === "approve" ? "manual" : "blocked",
        detail:
          assessment.decision === "approve"
            ? "Buyer signature is still required before real funds move."
            : "Funds stay locked until required follow-up clears."
      },
      {
        id: "casper",
        label: "Casper verification",
        status: casperRecorded ? "ready" : "manual",
        detail: casperRecorded ? "Recorded on Casper Testnet." : "Payload is ready for Testnet deployment."
      },
      {
        id: "audit",
        label: "Portable audit dossier",
        status: "ready",
        detail: "The JSON dossier can be exported to lenders, buyers, suppliers, or auditors."
      }
    ]
  };
}
