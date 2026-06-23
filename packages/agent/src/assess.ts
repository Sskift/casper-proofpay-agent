import type {
  AgentAssessment,
  EvidenceBundle,
  EvidenceDocument,
  ExtractedClaim,
  RiskFlag
} from "./types";

const POLICY_VERSION = "proofpay-rwa-policy-2026-06";

function documentOf(bundle: EvidenceBundle, type: EvidenceDocument["type"]): EvidenceDocument | undefined {
  return bundle.documents.find((document) => document.type === type);
}

function claim(label: string, value: string | number | undefined, source: string, status: ExtractedClaim["status"]): ExtractedClaim {
  return {
    label,
    value: value === undefined ? "missing" : String(value),
    source,
    status
  };
}

export function assessEvidence(bundle: EvidenceBundle): AgentAssessment {
  const invoice = documentOf(bundle, "invoice");
  const billOfLading = documentOf(bundle, "bill_of_lading");
  const deliveryNote = documentOf(bundle, "delivery_note");
  const temperatureLog = documentOf(bundle, "temperature_log");
  const vendorRegistry = documentOf(bundle, "vendor_registry");
  const flags: RiskFlag[] = [];
  const reasons: string[] = [];
  const requiredFollowUp: string[] = [];

  if (!deliveryNote?.claims.signedBy || !deliveryNote.claims.deliveredAt) {
    flags.push("missing_delivery_confirmation");
    requiredFollowUp.push("Request a signed delivery note from the receiving warehouse.");
  }

  if (invoice?.claims.amount !== bundle.expected.amount) {
    flags.push("amount_mismatch");
    requiredFollowUp.push("Confirm the final invoice amount with buyer finance.");
  }

  if (invoice?.claims.currency !== bundle.expected.currency) {
    flags.push("currency_mismatch");
    requiredFollowUp.push("Confirm the settlement currency before release.");
  }

  if (invoice?.claims.duplicateOf) {
    flags.push("duplicate_invoice");
    requiredFollowUp.push("Escalate duplicate invoice fingerprint to fraud review.");
  }

  if (
    temperatureLog?.claims.temperatureMinC === undefined ||
    temperatureLog?.claims.temperatureMaxC === undefined ||
    temperatureLog.claims.temperatureMinC < bundle.expected.temperatureMinC ||
    temperatureLog.claims.temperatureMaxC > bundle.expected.temperatureMaxC
  ) {
    flags.push("temperature_excursion");
    requiredFollowUp.push("Inspect raw cold-chain telemetry before payment.");
  }

  const counterpartiesMatch =
    invoice?.claims.buyer === bundle.expected.buyer &&
    invoice?.claims.supplier === bundle.expected.supplier &&
    billOfLading?.claims.supplier === bundle.expected.supplier &&
    vendorRegistry?.claims.supplier === bundle.expected.supplier;

  if (!counterpartiesMatch) {
    flags.push("counterparty_mismatch");
    requiredFollowUp.push("Verify buyer and supplier identities against registry records.");
  }

  const shipmentMatches =
    invoice?.claims.shipmentId === bundle.expected.shipmentId &&
    billOfLading?.claims.shipmentId === bundle.expected.shipmentId &&
    deliveryNote?.claims.shipmentId === bundle.expected.shipmentId &&
    temperatureLog?.claims.shipmentId === bundle.expected.shipmentId;

  if (shipmentMatches && flags.length === 0) {
    reasons.push("invoice, delivery note, and bill of lading align with the milestone");
    reasons.push("cold-chain telemetry stayed inside the contracted 2C to 8C band");
    reasons.push("supplier identity matches the registry snapshot");
  } else {
    reasons.push("agent detected evidence exceptions that prevent automatic release");
  }

  const uniqueFlags = [...new Set(flags)];
  const decision = uniqueFlags.includes("duplicate_invoice")
    ? "reject"
    : uniqueFlags.length > 0
      ? "hold"
      : "approve";

  const riskScore =
    decision === "approve"
      ? 12
      : decision === "reject"
        ? 88
        : Math.min(72, 32 + uniqueFlags.length * 13);

  const confidence = decision === "approve" ? 94 : decision === "reject" ? 91 : 72;

  return {
    id: `assessment-${bundle.id}-${decision}`,
    bundleId: bundle.id,
    decision,
    confidence,
    riskScore,
    flags: uniqueFlags,
    reasons,
    requiredFollowUp,
    extractedClaims: [
      claim("Invoice amount", invoice?.claims.amount, invoice?.title ?? "invoice", invoice?.claims.amount === bundle.expected.amount ? "matched" : "failed"),
      claim("Currency", invoice?.claims.currency, invoice?.title ?? "invoice", invoice?.claims.currency === bundle.expected.currency ? "matched" : "failed"),
      claim("Shipment id", invoice?.claims.shipmentId, invoice?.title ?? "invoice", shipmentMatches ? "matched" : "failed"),
      claim("Delivery signature", deliveryNote?.claims.signedBy, deliveryNote?.title ?? "delivery note", deliveryNote?.claims.signedBy ? "matched" : "warning"),
      claim(
        "Temperature range",
        temperatureLog?.claims.temperatureMinC !== undefined && temperatureLog.claims.temperatureMaxC !== undefined
          ? `${temperatureLog.claims.temperatureMinC}C to ${temperatureLog.claims.temperatureMaxC}C`
          : undefined,
        temperatureLog?.title ?? "temperature log",
        uniqueFlags.includes("temperature_excursion") ? "failed" : "matched"
      ),
      claim("Duplicate check", invoice?.claims.duplicateOf ?? "clear", invoice?.title ?? "invoice", uniqueFlags.includes("duplicate_invoice") ? "failed" : "matched")
    ],
    policyVersion: POLICY_VERSION,
    assessedAt: bundle.submittedAt
  };
}
