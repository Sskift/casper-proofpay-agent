import { assessEvidence, createEvidenceHash, seededDeals, seededEvidenceBundles } from "@proofpay/agent";
import { createAttestationPayload } from "@proofpay/casper";

type ScenarioKey = keyof typeof seededEvidenceBundles;

const args = process.argv.slice(2);
const asEnv = args.includes("--env");
const scenarioArg = args.find((arg) => !arg.startsWith("--")) ?? process.env.PROOFPAY_SCENARIO ?? "clean";

function isScenario(value: string): value is ScenarioKey {
  return Object.prototype.hasOwnProperty.call(seededEvidenceBundles, value);
}

function shellQuote(value: string | number): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

if (!isScenario(scenarioArg)) {
  const options = Object.keys(seededEvidenceBundles).join(", ");
  console.error(`Unknown ProofPay scenario "${scenarioArg}". Expected one of: ${options}`);
  process.exit(1);
}

const deal = seededDeals[0];
const bundle = seededEvidenceBundles[scenarioArg];
const milestone = deal.milestones.find((item) => item.id === bundle.milestoneId);

if (!milestone) {
  console.error(`No milestone found for evidence bundle "${bundle.id}".`);
  process.exit(1);
}

const assessment = assessEvidence(bundle);
const evidenceHash = createEvidenceHash(bundle);
const payload = createAttestationPayload({ milestone, evidenceHash, assessment });

if (asEnv) {
  const values = {
    PROOFPAY_SCENARIO: scenarioArg,
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
  console.log(JSON.stringify(payload, null, 2));
}
