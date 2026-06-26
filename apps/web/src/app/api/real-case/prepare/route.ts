import { assessEvidence, createEvidenceHash, parseEvidenceBundle, type Deal, type EvidenceBundle, type Milestone } from "@proofpay/agent";
import { createAttestationPayload, createCasperDeployPlan, verifyCasperAttestation } from "@proofpay/casper";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
        schemaVersion: "proofpay.api.realCasePrepare.v1",
        accepted: false,
        report: parsed.report
      },
      { status: 422 }
    );
  }

  const { deal, milestone } = createDealFromBundle(parsed.bundle);
  const assessment = assessEvidence(parsed.bundle);
  const evidenceHash = createEvidenceHash(parsed.bundle);
  const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
  const deployPlan = createCasperDeployPlan({
    payload,
    scenario: "realCase",
    secretKeyPath: "$CASPER_SECRET_KEY"
  });
  const attestationVerification = verifyCasperAttestation({
    payload,
    deployment: deployPlan.deployment
  });

  return NextResponse.json({
    schemaVersion: "proofpay.api.realCasePrepare.v1",
    accepted: true,
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
      sessionArgs: deployPlan.sessionArgs,
      cliCommand: deployPlan.cliCommand
    },
    nextSteps: [
      "Run the same JSON locally with npm run realcase:prepare -- <case.json>.",
      "Set CASPER_SECRET_KEY to a funded Casper Testnet account on your machine.",
      "Run npm run realcase:deploy:testnet -- <case.json> to submit a new transaction."
    ]
  });
}
