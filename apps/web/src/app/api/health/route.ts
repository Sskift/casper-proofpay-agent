import { NextResponse } from "next/server";

import { buildProofPayScenarioPackage } from "../proofpay-data";

export const dynamic = "force-dynamic";

const scenarioLabels = {
  clean: "Clean release",
  amountMismatch: "Hold for finance",
  duplicateInvoice: "Reject duplicate"
} as const;

export async function GET() {
  const scenarios = await Promise.all(
    (["clean", "amountMismatch", "duplicateInvoice"] as const).map(async (scenario) => {
      const proofPackage = await buildProofPayScenarioPackage(scenario);

      return {
        scenario,
        label: scenarioLabels[scenario],
        decision: proofPackage.assessment.decision,
        riskScore: proofPackage.assessment.riskScore,
        confidence: proofPackage.assessment.confidence,
        evidenceHash: proofPackage.payload.evidenceHash,
        decisionHash: proofPackage.payload.decisionHash,
        transactionHash: proofPackage.deployPlan.deployment?.transactionHash,
        blockHeight: proofPackage.deployPlan.deployment?.blockHeight,
        namedKey: proofPackage.deployPlan.deployment?.namedKey,
        storedURef: proofPackage.deployPlan.deployment?.uref,
        attestationVerification: proofPackage.attestationVerification.status
      };
    })
  );

  return NextResponse.json({
    schemaVersion: "proofpay.api.health.v1",
    status: "ok",
    service: "ProofPay Agent full-stack API",
    generatedAt: new Date().toISOString(),
    routes: [
      "GET /api/health",
      "GET /api/attestation/clean",
      "GET /api/attestation/amountMismatch",
      "GET /api/attestation/duplicateInvoice",
      "POST /api/evidence/intake",
      "POST /api/real-case/prepare",
      "GET /api/judge-proof",
      "GET /api/mcp",
      "POST /api/mcp",
      "POST /api/x402/proof-review",
      "POST /api/settlement-adapter"
    ],
    boundary: {
      testnetOnly: true,
      noCustody: true,
      statement: "ProofPay records Casper Testnet attestations for payment decisions; this prototype does not custody or release real funds."
    },
    casperProofs: Object.fromEntries(scenarios.map((scenario) => [scenario.scenario, scenario]))
  });
}
