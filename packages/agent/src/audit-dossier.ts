import type {
  AgentAssessment,
  AuditDossier,
  AuditTraceStatus,
  AuditTraceStep,
  Deal,
  EvidenceBundle,
  EvidenceDocument,
  Milestone
} from "./types";

export interface CreateAuditDossierInput {
  deal: Deal;
  milestone: Milestone;
  bundle: EvidenceBundle;
  assessment: AgentAssessment;
  evidenceHash: `0x${string}`;
  decisionHash: `0x${string}` | string;
  casper: {
    network: string;
    transactionHash?: string;
    blockHeight?: number;
    namedKey?: string;
    storedURef?: string;
  };
  localTransactionHash?: string;
  cliCommand: string;
}

function money(currency: string | undefined, amount: number | undefined): string {
  if (amount === undefined) return "missing";
  return `${currency ?? ""} ${amount.toLocaleString("en-US")}`.trim();
}

function documentOf(bundle: EvidenceBundle, type: EvidenceDocument["type"]): EvidenceDocument | undefined {
  return bundle.documents.find((document) => document.type === type);
}

function statusFromFlag(
  assessment: AgentAssessment,
  flag: AgentAssessment["flags"][number],
  warningStatus: AuditTraceStatus = "failed"
): AuditTraceStatus {
  return assessment.flags.includes(flag) ? warningStatus : "passed";
}

function shipmentObserved(bundle: EvidenceBundle): string {
  const documents = ["invoice", "bill_of_lading", "delivery_note", "temperature_log"] as const;
  return documents
    .map((type) => documentOf(bundle, type)?.claims.shipmentId ?? "missing")
    .join(" / ");
}

function shipmentStatus(bundle: EvidenceBundle): AuditTraceStatus {
  const documents = ["invoice", "bill_of_lading", "delivery_note", "temperature_log"] as const;
  return documents.every((type) => documentOf(bundle, type)?.claims.shipmentId === bundle.expected.shipmentId)
    ? "passed"
    : "failed";
}

function counterpartyObserved(bundle: EvidenceBundle): string {
  const invoice = documentOf(bundle, "invoice");
  const billOfLading = documentOf(bundle, "bill_of_lading");
  const vendorRegistry = documentOf(bundle, "vendor_registry");
  return [
    invoice?.claims.buyer ?? "missing buyer",
    invoice?.claims.supplier ?? "missing invoice supplier",
    billOfLading?.claims.supplier ?? "missing bill supplier",
    vendorRegistry?.claims.supplier ?? "missing registry supplier"
  ].join(" / ");
}

function buildTrace(input: CreateAuditDossierInput): AuditTraceStep[] {
  const { assessment, bundle, casper } = input;
  const invoice = documentOf(bundle, "invoice");
  const deliveryNote = documentOf(bundle, "delivery_note");
  const temperatureLog = documentOf(bundle, "temperature_log");
  const vendorRegistry = documentOf(bundle, "vendor_registry");
  const casperReady = Boolean(casper.transactionHash && casper.namedKey && casper.storedURef);

  return [
    {
      id: "invoice-amount",
      label: "Invoice amount",
      expected: money(bundle.expected.currency, bundle.expected.amount),
      observed: money(invoice?.claims.currency, invoice?.claims.amount),
      status: statusFromFlag(assessment, "amount_mismatch"),
      impact: assessment.flags.includes("amount_mismatch")
        ? "Blocks automatic release until buyer finance approves the variance."
        : "Supports automatic milestone release.",
      sources: [invoice?.title ?? "invoice"]
    },
    {
      id: "settlement-currency",
      label: "Settlement currency",
      expected: bundle.expected.currency,
      observed: invoice?.claims.currency ?? "missing",
      status: statusFromFlag(assessment, "currency_mismatch"),
      impact: assessment.flags.includes("currency_mismatch")
        ? "Blocks release until settlement currency is confirmed."
        : "Settlement currency matches escrow terms.",
      sources: [invoice?.title ?? "invoice"]
    },
    {
      id: "shipment-identity",
      label: "Shipment identity",
      expected: bundle.expected.shipmentId,
      observed: shipmentObserved(bundle),
      status: shipmentStatus(bundle),
      impact: shipmentStatus(bundle) === "passed"
        ? "All shipment-bearing documents point to the same asset movement."
        : "Shipment identity mismatch requires manual evidence review.",
      sources: ["Invoice", "Bill of lading", "Delivery note", "Temperature log"]
    },
    {
      id: "delivery-confirmation",
      label: "Delivery confirmation",
      expected: "signed delivery note with delivered timestamp",
      observed: deliveryNote?.claims.signedBy
        ? `${deliveryNote.claims.signedBy} at ${deliveryNote.claims.deliveredAt ?? "missing timestamp"}`
        : "missing",
      status: statusFromFlag(assessment, "missing_delivery_confirmation", "warning"),
      impact: assessment.flags.includes("missing_delivery_confirmation")
        ? "Requires warehouse confirmation before funds can move."
        : "Receiver signature supports milestone completion.",
      sources: [deliveryNote?.title ?? "delivery note"]
    },
    {
      id: "temperature-band",
      label: "Temperature band",
      expected: `${bundle.expected.temperatureMinC}C to ${bundle.expected.temperatureMaxC}C`,
      observed:
        temperatureLog?.claims.temperatureMinC !== undefined && temperatureLog.claims.temperatureMaxC !== undefined
          ? `${temperatureLog.claims.temperatureMinC}C to ${temperatureLog.claims.temperatureMaxC}C`
          : "missing",
      status: statusFromFlag(assessment, "temperature_excursion"),
      impact: assessment.flags.includes("temperature_excursion")
        ? "Cold-chain exception blocks automatic payment release."
        : "Cold-chain telemetry stayed inside contracted bounds.",
      sources: [temperatureLog?.title ?? "temperature log"]
    },
    {
      id: "counterparty-registry",
      label: "Counterparty registry",
      expected: `${bundle.expected.buyer} / ${bundle.expected.supplier}`,
      observed: counterpartyObserved(bundle),
      status: statusFromFlag(assessment, "counterparty_mismatch"),
      impact: assessment.flags.includes("counterparty_mismatch")
        ? "Identity mismatch requires registry review."
        : "Buyer and supplier identities align with the registry snapshot.",
      sources: [invoice?.title ?? "invoice", vendorRegistry?.title ?? "vendor registry"]
    },
    {
      id: "duplicate-invoice",
      label: "Duplicate invoice",
      expected: "no prior settled attestation",
      observed: invoice?.claims.duplicateOf ?? "clear",
      status: statusFromFlag(assessment, "duplicate_invoice"),
      impact: assessment.flags.includes("duplicate_invoice")
        ? "Rejects payment release and escalates the fingerprint to fraud review."
        : "No duplicate settlement fingerprint was found.",
      sources: [invoice?.title ?? "invoice"]
    },
    {
      id: "casper-attestation",
      label: "Casper attestation",
      expected: "Testnet transaction hash, named key, and stored URef",
      observed: casperReady
        ? `${casper.transactionHash} / ${casper.namedKey} / ${casper.storedURef}`
        : "pending scenario deploy",
      status: casperReady ? "passed" : "pending",
      impact: casperReady
        ? "On-chain attestation can be verified by transaction hash and stored URef."
        : "Local decision is reproducible; deploy this scenario to add matching Testnet proof.",
      sources: ["Casper deploy plan", "docs/casper-testnet.md"]
    }
  ];
}

function buildChecklist(input: CreateAuditDossierInput): string[] {
  const { assessment, bundle, casper, cliCommand } = input;
  const checklist = [
    "Run npm install, npm run test, and npm run build from the GitHub repository.",
    `Open the dashboard and select the ${bundle.scenario} scenario.`,
    "Compare the evidence hash and decision hash in this dossier with the Casper panel.",
    "Review every trace step against the normalized document claims."
  ];

  if (casper.transactionHash) {
    checklist.push(`Verify Casper Testnet transaction ${casper.transactionHash} and stored URef ${casper.storedURef ?? "missing"}.`);
  } else {
    checklist.push(`Deploy this scenario with: ${cliCommand}`);
  }

  for (const item of assessment.requiredFollowUp) {
    checklist.push(`Resolve follow-up: ${item}`);
  }

  return checklist;
}

export function createAuditDossier(input: CreateAuditDossierInput): AuditDossier {
  const { assessment, bundle, casper, decisionHash, evidenceHash, localTransactionHash, milestone } = input;

  return {
    id: `dossier-${bundle.id}-${assessment.decision}`,
    scenario: bundle.scenario,
    decision: assessment.decision,
    confidence: assessment.confidence,
    riskScore: assessment.riskScore,
    policyVersion: assessment.policyVersion,
    releaseAmount: money(milestone.currency, milestone.amount),
    generatedAt: assessment.assessedAt,
    verification: {
      evidenceHash,
      decisionHash,
      localTransactionHash,
      network: casper.network,
      casperTransactionHash: casper.transactionHash,
      blockHeight: casper.blockHeight,
      namedKey: casper.namedKey,
      storedURef: casper.storedURef,
      cliCommand: input.cliCommand
    },
    trace: buildTrace(input),
    reviewChecklist: buildChecklist(input)
  };
}
