import { parseEvidenceBundle } from "@proofpay/agent";
import { NextResponse } from "next/server";

import { buildExternalProofPayPackage } from "../../proofpay-data";

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
        schemaVersion: "proofpay.api.evidenceIntake.v1",
        accepted: false,
        report: parsed.report
      },
      { status: 422 }
    );
  }

  const proofPackage = await buildExternalProofPayPackage(parsed.bundle);

  return NextResponse.json({
    schemaVersion: "proofpay.api.evidenceIntake.v1",
    accepted: true,
    report: parsed.report,
    assessment: proofPackage.assessment,
    payload: proofPackage.payload,
    verification: proofPackage.verification,
    attestationVerification: proofPackage.attestationVerification,
    settlementRunbook: proofPackage.settlementRunbook,
    dossier: proofPackage.dossier
  });
}
