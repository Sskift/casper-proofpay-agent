import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  assessEvidence,
  createEvidenceHash,
  parseEvidenceBundle,
  type Deal,
  type EvidenceBundle,
  type Milestone
} from "@proofpay/agent";
import { createAttestationPayload, createCasperDeployPlan, verifyCasperAttestation } from "@proofpay/casper";

const args = process.argv.slice(2);
const asEnv = args.includes("--env");
const casePath = args.find((arg) => !arg.startsWith("--")) ?? process.env.PROOFPAY_REAL_CASE_FILE;

function usage(): never {
  console.error("Usage: npm run realcase:prepare -- <path/to/real-case.json> [--env]");
  console.error("Example: npm run realcase:prepare -- examples/real-case-template.json");
  process.exit(1);
}

function shellQuote(value: string | number): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function createDealFromBundle(bundle: EvidenceBundle): { deal: Deal; milestone: Milestone } {
  const milestone: Milestone = {
    id: bundle.milestoneId,
    dealId: bundle.dealId,
    title: "Real case milestone release",
    description: "Release payment after the supplied real-world evidence matches the milestone terms.",
    amount: bundle.expected.amount,
    currency: bundle.expected.currency,
    dueDate: "not-specified",
    state: "under_agent_review",
    requiredEvidence: ["invoice", "bill_of_lading", "delivery_note", "temperature_log", "vendor_registry"]
  };

  return {
    deal: {
      id: bundle.dealId,
      name: "Real RWA milestone case",
      buyer: bundle.expected.buyer,
      supplier: bundle.expected.supplier,
      assetType: bundle.documents.find((document) => document.claims.assetDescription)?.claims.assetDescription ?? "Real-world asset delivery",
      jurisdiction: "real case evidence package",
      escrowAmount: bundle.expected.amount,
      currency: bundle.expected.currency,
      milestones: [milestone]
    },
    milestone
  };
}

if (!casePath) {
  usage();
}

const absoluteCasePath = resolve(casePath);
const rawCase = await readFile(absoluteCasePath, "utf8");
let parsedJson: unknown;

try {
  parsedJson = JSON.parse(rawCase);
} catch (error) {
  console.error(`Real case JSON is invalid: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const parsed = parseEvidenceBundle(parsedJson);

if (!parsed.ok) {
  console.error(JSON.stringify({
    schemaVersion: "proofpay.realcase.prepare.v1",
    accepted: false,
    casePath: absoluteCasePath,
    report: parsed.report
  }, null, 2));
  process.exit(2);
}

const { deal, milestone } = createDealFromBundle(parsed.bundle);
const assessment = assessEvidence(parsed.bundle);
const evidenceHash = createEvidenceHash(parsed.bundle);
const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
const deployPlan = createCasperDeployPlan({
  payload,
  scenario: "realCase",
  secretKeyPath: process.env.CASPER_SECRET_KEY ?? "$CASPER_SECRET_KEY"
});
const attestationVerification = verifyCasperAttestation({
  payload,
  deployment: deployPlan.deployment
});

if (asEnv) {
  const values = {
    PROOFPAY_SCENARIO: "realCase",
    PROOFPAY_MILESTONE_ID: payload.milestoneId,
    PROOFPAY_EVIDENCE_HASH: payload.evidenceHash,
    PROOFPAY_DECISION: payload.decision,
    PROOFPAY_DECISION_HASH: payload.decisionHash,
    PROOFPAY_CONFIDENCE: payload.confidence,
    PROOFPAY_RISK_SCORE: payload.riskScore
  };

  for (const [key, value] of Object.entries(values)) {
    console.log(`export ${key}=${shellQuote(value)}`);
  }
} else {
  console.log(JSON.stringify({
    schemaVersion: "proofpay.realcase.prepare.v1",
    accepted: true,
    casePath: absoluteCasePath,
    deal,
    milestone,
    report: parsed.report,
    assessment,
    payload,
    attestationVerification,
    deploy: {
      network: deployPlan.network,
      nodeAddress: deployPlan.nodeAddress,
      chainName: deployPlan.chainName,
      publicKeyHex: deployPlan.publicKeyHex,
      accountHash: deployPlan.accountHash,
      wasmPath: deployPlan.wasmPath,
      paymentAmount: deployPlan.paymentAmount,
      gasPriceTolerance: deployPlan.gasPriceTolerance,
      deployment: deployPlan.deployment,
      sessionArgs: deployPlan.sessionArgs,
      cliCommand: deployPlan.cliCommand
    },
    nextSteps:
      attestationVerification.status === "verified"
        ? [
            "Open the recorded Casper Testnet transaction in CSPR.live.",
            "Query the stored URef to confirm the on-chain payload matches this evidence hash and decision hash.",
            "Use a new redacted case JSON with the same realcase:* scripts to run another fresh case."
          ]
        : [
            "Review the assessment decision, evidence hash, and decision hash.",
            "Set CASPER_SECRET_KEY to a funded Casper Testnet secret_key.pem path on this machine.",
            "Run npm run realcase:deploy:print -- <casePath> to inspect the exact transaction command.",
            "Run npm run realcase:deploy:testnet -- <casePath> only when you are ready to submit a new Casper Testnet transaction."
          ]
  }, null, 2));
}
