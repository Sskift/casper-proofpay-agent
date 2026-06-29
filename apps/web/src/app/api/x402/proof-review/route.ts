import { parseEvidenceBundle } from "@proofpay/agent";
import { NextResponse } from "next/server";

import { buildExternalProofPayPackage } from "../../proofpay-data";
import { createSettlementInstruction } from "../../settlement-instruction";

export async function POST(request: Request) {
  if (request.headers.get("x-proofpay-demo-paid") !== "true") {
    return NextResponse.json(
      {
        schemaVersion: "proofpay.x402.proofReviewPaymentRequired.v1",
        paymentRequired: true,
        service: "proofpay.proofReview",
        amount: "0.01",
        currency: "USDC",
        network: "Casper Testnet",
        acceptedPaymentHeader: "x-proofpay-demo-paid: true",
        settlementNote:
          "Demo x402 handshake only. Send the accepted header to receive the evidence proof review package."
      },
      { status: 402 }
    );
  }

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
        schemaVersion: "proofpay.x402.proofReview.v1",
        paymentRequired: false,
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
    schemaVersion: "proofpay.x402.proofReview.v1",
    paymentRequired: false,
    accepted: true,
    x402: {
      protocol: "x402-ready-demo",
      status: "demo-paid",
      service: "proofpay.proofReview",
      note: "Payment is simulated for the hackathon demo; the proof review payload is real and deterministic."
    },
    report: parsed.report,
    assessment: proofPackage.assessment,
    payload: proofPackage.payload,
    settlementInstruction,
    casper: {
      attestationVerification: proofPackage.attestationVerification.status,
      transactionHash: proofPackage.deployPlan.deployment?.transactionHash ?? null,
      namedKey: proofPackage.deployPlan.deployment?.namedKey ?? null,
      storedURef: proofPackage.deployPlan.deployment?.uref ?? null,
      nextStep:
        proofPackage.attestationVerification.status === "verified"
          ? "Open the recorded Casper Testnet transaction for this proof."
          : "Submit the generated payload with local signing to anchor this external review."
    },
    dossier: {
      id: proofPackage.dossier.id,
      trace: proofPackage.dossier.trace,
      reviewChecklist: proofPackage.dossier.reviewChecklist
    }
  });
}

