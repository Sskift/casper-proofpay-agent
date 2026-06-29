import { parseEvidenceBundle } from "@proofpay/agent";
import { NextResponse } from "next/server";

import { buildExternalProofPayPackage } from "../proofpay-data";
import { createSettlementInstruction } from "../settlement-instruction";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_json",
        message: "Request body must be valid JSON."
      },
      { status: 400 }
    );
  }

  const parsed = parseEvidenceBundle(body);

  if (!parsed.ok) {
    return NextResponse.json(
      {
        schemaVersion: "proofpay.api.settlementAdapter.v1",
        accepted: false,
        report: parsed.report
      },
      { status: 422 }
    );
  }

  const proofPackage = await buildExternalProofPayPackage(parsed.bundle);
  const settlementInstruction = createSettlementInstruction({
    decision: proofPackage.assessment.decision,
    settlementRunbook: proofPackage.settlementRunbook
  });

  return NextResponse.json({
    schemaVersion: "proofpay.api.settlementAdapter.v1",
    accepted: true,
    report: parsed.report,
    assessment: proofPackage.assessment,
    settlementInstruction,
    boundary: {
      noCustody: true,
      statement: "ProofPay prepares human-controlled payment instructions from evidence decisions; it does not custody or move real funds."
    },
    casperAttestation: {
      status: proofPackage.attestationVerification.status,
      payloadHash: proofPackage.payload.evidenceHash,
      decisionHash: proofPackage.payload.decisionHash,
      transactionHash: proofPackage.deployPlan.deployment?.transactionHash ?? null,
      nextStep:
        proofPackage.attestationVerification.status === "verified"
          ? "Use the recorded Casper Testnet proof when reviewing the settlement instruction."
          : "Use local signing to anchor this external evidence package on Casper Testnet."
    }
  });
}

