import type {
  EvidenceBundle,
  EvidenceClaims,
  EvidenceDocument,
  EvidenceDocumentType,
  EvidenceExpectation
} from "./types";

export type EvidenceIntakeSeverity = "error" | "warning";
export type EvidenceIntakeStatus = "ready" | "needs_review" | "blocked";

export interface EvidenceIntakeIssue {
  severity: EvidenceIntakeSeverity;
  field: string;
  message: string;
  remediation: string;
}

export interface EvidenceIntakeCoverage {
  type: EvidenceDocumentType;
  present: boolean;
  status: "complete" | "missing" | "weak";
  detail: string;
}

export interface EvidenceIntakeReport {
  status: EvidenceIntakeStatus;
  canAssess: boolean;
  documentsReceived: number;
  coverage: EvidenceIntakeCoverage[];
  issues: EvidenceIntakeIssue[];
  summary: string;
}

export type EvidenceBundleParseResult = {
  ok: true;
  bundle: EvidenceBundle;
  report: EvidenceIntakeReport;
} | {
  ok: false;
  report: EvidenceIntakeReport;
};

export const requiredEvidenceDocumentTypes: EvidenceDocumentType[] = [
  "invoice",
  "bill_of_lading",
  "delivery_note",
  "temperature_log",
  "vendor_registry"
];

const documentLabels: Record<EvidenceDocumentType, string> = {
  invoice: "invoice commercial terms",
  bill_of_lading: "bill of lading shipment identity",
  delivery_note: "receiver delivery confirmation",
  temperature_log: "cold-chain telemetry",
  vendor_registry: "supplier registry snapshot"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseDocumentType(value: unknown): EvidenceDocumentType | undefined {
  return requiredEvidenceDocumentTypes.find((type) => type === value);
}

function parseExpectation(value: unknown, issues: EvidenceIntakeIssue[]): EvidenceExpectation | null {
  if (!isRecord(value)) {
    issues.push({
      severity: "error",
      field: "expected",
      message: "Expected milestone terms are missing.",
      remediation: "Provide buyer, supplier, amount, currency, shipmentId, and temperature bounds."
    });
    return null;
  }

  const expected = {
    buyer: asString(value.buyer),
    supplier: asString(value.supplier),
    amount: asNumber(value.amount),
    currency: asString(value.currency),
    shipmentId: asString(value.shipmentId),
    temperatureMinC: asNumber(value.temperatureMinC),
    temperatureMaxC: asNumber(value.temperatureMaxC)
  };

  for (const [field, parsedValue] of Object.entries(expected)) {
    if (parsedValue === undefined) {
      issues.push({
        severity: "error",
        field: `expected.${field}`,
        message: `Expected ${field} is required.`,
        remediation: "Include complete milestone terms before the agent can assess payment release."
      });
    }
  }

  if (
    expected.temperatureMinC !== undefined &&
    expected.temperatureMaxC !== undefined &&
    expected.temperatureMinC >= expected.temperatureMaxC
  ) {
    issues.push({
      severity: "error",
      field: "expected.temperature",
      message: "Temperature lower bound must be less than the upper bound.",
      remediation: "Correct the contracted temperature band."
    });
  }

  if (Object.values(expected).some((parsedValue) => parsedValue === undefined)) {
    return null;
  }

  return expected as EvidenceExpectation;
}

function parseClaims(value: unknown): EvidenceClaims {
  if (!isRecord(value)) return {};

  const claims = {
    invoiceId: asString(value.invoiceId),
    purchaseOrder: asString(value.purchaseOrder),
    buyer: asString(value.buyer),
    supplier: asString(value.supplier),
    amount: asNumber(value.amount),
    currency: asString(value.currency),
    shipmentId: asString(value.shipmentId),
    assetDescription: asString(value.assetDescription),
    deliveredAt: asString(value.deliveredAt),
    deliveryLocation: asString(value.deliveryLocation),
    signedBy: asString(value.signedBy),
    temperatureMinC: asNumber(value.temperatureMinC),
    temperatureMaxC: asNumber(value.temperatureMaxC),
    duplicateOf: asString(value.duplicateOf)
  };

  return Object.fromEntries(
    Object.entries(claims).filter(([, parsedValue]) => parsedValue !== undefined)
  ) as EvidenceClaims;
}

function parseDocument(value: unknown, index: number, issues: EvidenceIntakeIssue[]): EvidenceDocument | null {
  if (!isRecord(value)) {
    issues.push({
      severity: "error",
      field: `documents.${index}`,
      message: "Document entry must be an object.",
      remediation: "Send each evidence document with id, type, title, issuedAt, fingerprint, and claims."
    });
    return null;
  }

  const type = parseDocumentType(value.type);
  const document = {
    id: asString(value.id),
    type,
    title: asString(value.title),
    issuedAt: asString(value.issuedAt),
    fingerprint: asString(value.fingerprint),
    claims: parseClaims(value.claims)
  };

  for (const field of ["id", "title", "issuedAt", "fingerprint"] as const) {
    if (!document[field]) {
      issues.push({
        severity: "error",
        field: `documents.${index}.${field}`,
        message: `Document ${field} is required.`,
        remediation: "Provide stable document metadata so the evidence hash is reproducible."
      });
    }
  }

  if (!document.type) {
    issues.push({
      severity: "error",
      field: `documents.${index}.type`,
      message: "Document type is not supported.",
      remediation: `Use one of: ${requiredEvidenceDocumentTypes.join(", ")}.`
    });
  }

  if (!isRecord(value.claims)) {
    issues.push({
      severity: "warning",
      field: `documents.${index}.claims`,
      message: "Document claims are empty or missing.",
      remediation: "Extract or provide key claims before expecting an automatic release."
    });
  }

  if (!document.id || !document.type || !document.title || !document.issuedAt || !document.fingerprint) {
    return null;
  }

  return document as EvidenceDocument;
}

function claimsAreWeak(document: EvidenceDocument): boolean {
  if (document.type === "invoice") {
    return !document.claims.amount || !document.claims.currency || !document.claims.shipmentId;
  }
  if (document.type === "delivery_note") {
    return !document.claims.deliveredAt || !document.claims.signedBy || !document.claims.shipmentId;
  }
  if (document.type === "temperature_log") {
    return document.claims.temperatureMinC === undefined || document.claims.temperatureMaxC === undefined;
  }
  if (document.type === "vendor_registry") {
    return !document.claims.supplier;
  }
  return !document.claims.shipmentId;
}

function buildReport(documents: EvidenceDocument[], issues: EvidenceIntakeIssue[]): EvidenceIntakeReport {
  const coverage = requiredEvidenceDocumentTypes.map((type) => {
    const document = documents.find((item) => item.type === type);
    const weak = document ? claimsAreWeak(document) : false;

    return {
      type,
      present: Boolean(document),
      status: !document ? "missing" : weak ? "weak" : "complete",
      detail: !document
        ? `${documentLabels[type]} is missing`
        : weak
          ? `${document.title} needs stronger extracted claims`
          : `${document.title} covers ${documentLabels[type]}`
    } satisfies EvidenceIntakeCoverage;
  });

  for (const item of coverage) {
    if (item.status === "missing") {
      issues.push({
        severity: "error",
        field: `documents.${item.type}`,
        message: `${item.type.replaceAll("_", " ")} evidence is missing.`,
        remediation: "Collect the missing document before the agent can recommend release."
      });
    }
    if (item.status === "weak") {
      issues.push({
        severity: "warning",
        field: `documents.${item.type}.claims`,
        message: `${item.type.replaceAll("_", " ")} has incomplete claims.`,
        remediation: "Ask the submitter to re-upload or enrich the extracted fields."
      });
    }
  }

  const hasErrors = issues.some((issue) => issue.severity === "error");
  const hasWarnings = issues.some((issue) => issue.severity === "warning");
  const status: EvidenceIntakeStatus = hasErrors ? "blocked" : hasWarnings ? "needs_review" : "ready";

  return {
    status,
    canAssess: !hasErrors,
    documentsReceived: documents.length,
    coverage,
    issues,
    summary:
      status === "ready"
        ? "Evidence pack is complete enough for autonomous assessment."
        : status === "needs_review"
          ? "Evidence pack can be assessed, but weak claims should be reviewed before release."
          : "Evidence pack is missing required proof and cannot support release yet."
  };
}

export function inspectEvidenceIntake(bundle: EvidenceBundle): EvidenceIntakeReport {
  return buildReport(bundle.documents, []);
}

export function parseEvidenceBundle(input: unknown): EvidenceBundleParseResult {
  const issues: EvidenceIntakeIssue[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      report: buildReport([], [
        {
          severity: "error",
          field: "body",
          message: "Request body must be an evidence bundle object.",
          remediation: "Submit a JSON object with dealId, milestoneId, expected, and documents."
        }
      ])
    };
  }

  const expected = parseExpectation(input.expected, issues);
  const rawDocuments = Array.isArray(input.documents) ? input.documents : [];

  if (!Array.isArray(input.documents)) {
    issues.push({
      severity: "error",
      field: "documents",
      message: "Documents must be an array.",
      remediation: "Submit invoice, bill of lading, delivery note, temperature log, and vendor registry documents."
    });
  }

  const documents = rawDocuments
    .map((item, index) => parseDocument(item, index, issues))
    .filter((document): document is EvidenceDocument => Boolean(document));
  const id = asString(input.id);
  const dealId = asString(input.dealId);
  const milestoneId = asString(input.milestoneId);
  const scenario = input.scenario === "amountMismatch" || input.scenario === "duplicateInvoice" ? input.scenario : "clean";
  const submittedBy = asString(input.submittedBy);
  const submittedAt = asString(input.submittedAt);
  const summary = asString(input.summary);

  const missingBundleFields = [
    ["id", id],
    ["dealId", dealId],
    ["milestoneId", milestoneId],
    ["submittedBy", submittedBy],
    ["submittedAt", submittedAt],
    ["summary", summary]
  ] as const;

  for (const [field, value] of missingBundleFields) {
    if (!value) {
      issues.push({
        severity: "error",
        field,
        message: `Bundle ${field} is required.`,
        remediation: "Provide complete bundle metadata so the audit dossier can reference this submission."
      });
    }
  }

  const finalReport = buildReport(documents, issues);

  if (!expected || !id || !dealId || !milestoneId || !submittedBy || !submittedAt || !summary || !finalReport.canAssess) {
    return {
      ok: false,
      report: finalReport
    };
  }

  return {
    ok: true,
    bundle: {
      id,
      dealId,
      milestoneId,
      scenario,
      submittedBy,
      submittedAt,
      summary,
      expected,
      documents
    },
    report: finalReport
  };
}
