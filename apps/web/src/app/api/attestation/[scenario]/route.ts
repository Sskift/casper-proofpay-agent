import { NextResponse } from "next/server";

import { buildProofPayScenarioPackage, isScenarioKey } from "../../proofpay-data";

interface RouteContext {
  params: Promise<{ scenario: string }> | { scenario: string };
}

export async function GET(_request: Request, context: RouteContext) {
  const params = await Promise.resolve(context.params);

  if (!isScenarioKey(params.scenario)) {
    return NextResponse.json(
      {
        error: "unknown_scenario",
        scenarios: ["clean", "amountMismatch", "duplicateInvoice"]
      },
      { status: 404 }
    );
  }

  const proofPackage = await buildProofPayScenarioPackage(params.scenario);

  return NextResponse.json({
    schemaVersion: "proofpay.api.attestation.v1",
    scenario: proofPackage.scenario,
    assessment: proofPackage.assessment,
    payload: proofPackage.payload,
    verification: proofPackage.verification,
    deployPlan: {
      network: proofPackage.deployPlan.network,
      chainName: proofPackage.deployPlan.chainName,
      readiness: proofPackage.deployPlan.readiness,
      deployment: proofPackage.deployPlan.deployment,
      postFundingCommands: proofPackage.deployPlan.postFundingCommands
    },
    dossier: proofPackage.dossier
  });
}
