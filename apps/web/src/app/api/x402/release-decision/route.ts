import { NextResponse } from "next/server";

import { buildProofPayScenarioPackage, isScenarioKey, type ScenarioKey } from "../../proofpay-data";

function scenarioFromRequest(request: Request): ScenarioKey {
  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario") ?? "clean";
  return isScenarioKey(scenario) ? scenario : "clean";
}

export async function POST(request: Request) {
  const scenario = scenarioFromRequest(request);

  if (request.headers.get("x-proofpay-demo-paid") !== "true") {
    return NextResponse.json(
      {
        paymentRequired: true,
        protocol: "x402-ready-demo",
        amount: "0.01",
        currency: "USDC",
        network: "Casper Testnet",
        settlementNote:
          "Demo handshake only. Send x-proofpay-demo-paid: true to receive the release decision package."
      },
      { status: 402 }
    );
  }

  const proofPackage = await buildProofPayScenarioPackage(scenario);

  return NextResponse.json({
    paymentRequired: false,
    schemaVersion: "proofpay.x402.releaseDecision.v1",
    scenario,
    decision: proofPackage.assessment.decision,
    confidence: proofPackage.assessment.confidence,
    riskScore: proofPackage.assessment.riskScore,
    payload: proofPackage.payload,
    verification: proofPackage.verification,
    dossierId: proofPackage.dossier.id
  });
}
