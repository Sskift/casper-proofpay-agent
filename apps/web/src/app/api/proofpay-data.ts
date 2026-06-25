import {
  assessEvidence,
  createAuditDossier,
  createEvidenceHash,
  createSettlementRunbook,
  inspectEvidenceIntake,
  createProductDepthModel,
  type Deal,
  type EvidenceBundle,
  type Milestone,
  seededDeals,
  seededEvidenceBundles
} from "@proofpay/agent";
import {
  createAttestationPayload,
  createCasperDeployPlan,
  createCasperVerificationSummary,
  submitDemoAttestation,
  verifyCasperAttestation
} from "@proofpay/casper";

export type ScenarioKey = keyof typeof seededEvidenceBundles;

export function isScenarioKey(value: string): value is ScenarioKey {
  return Object.prototype.hasOwnProperty.call(seededEvidenceBundles, value);
}

function createDealFromBundle(bundle: EvidenceBundle): { deal: Deal; milestone: Milestone } {
  const milestone: Milestone = {
    id: bundle.milestoneId,
    dealId: bundle.dealId,
    title: "Release payment after verified RWA delivery",
    description: "Pay the supplier when required real-world evidence matches the milestone terms.",
    amount: bundle.expected.amount,
    currency: bundle.expected.currency,
    dueDate: "not-specified",
    state: "under_agent_review",
    requiredEvidence: ["invoice", "bill_of_lading", "delivery_note", "temperature_log", "vendor_registry"]
  };

  return {
    deal: {
      id: bundle.dealId,
      name: "External RWA Milestone Escrow",
      buyer: bundle.expected.buyer,
      supplier: bundle.expected.supplier,
      assetType: bundle.documents.find((document) => document.claims.assetDescription)?.claims.assetDescription ?? "Real-world asset shipment",
      jurisdiction: "external evidence package",
      escrowAmount: bundle.expected.amount,
      currency: bundle.expected.currency,
      milestones: [milestone]
    },
    milestone
  };
}

export async function buildProofPayBundlePackage({
  deal,
  milestone,
  bundle,
  scenario
}: {
  deal: Deal;
  milestone: Milestone;
  bundle: EvidenceBundle;
  scenario: string;
}) {
  const intakeReport = inspectEvidenceIntake(bundle);

  if (!milestone) {
    throw new Error(`No milestone found for scenario ${scenario}`);
  }

  const assessment = assessEvidence(bundle);
  const evidenceHash = createEvidenceHash(bundle);
  const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
  const deployPlan = createCasperDeployPlan({ payload, scenario });
  const verification = createCasperVerificationSummary(deployPlan);
  const attestationVerification = verifyCasperAttestation({
    payload,
    deployment: deployPlan.deployment
  });
  const localTransaction = await submitDemoAttestation(payload);
  const dossier = createAuditDossier({
    deal,
    milestone,
    bundle,
    assessment,
    evidenceHash,
    decisionHash: payload.decisionHash,
    casper: {
      network: deployPlan.network,
      transactionHash: deployPlan.deployment?.transactionHash,
      blockHeight: deployPlan.deployment?.blockHeight,
      namedKey: deployPlan.deployment?.namedKey,
      storedURef: deployPlan.deployment?.uref
    },
    localTransactionHash: localTransaction.hash,
    cliCommand: deployPlan.cliCommand
  });
  const settlementRunbook = createSettlementRunbook({
    deal,
    milestone,
    bundle,
    assessment,
    dossier
  });
  const productDepth = createProductDepthModel({
    deal,
    milestone,
    bundle,
    assessment,
    evidenceHash,
    allBundles: seededEvidenceBundles,
    casperRecorded: Boolean(deployPlan.deployment)
  });

  return {
    scenario,
    deal,
    milestone,
    bundle,
    intakeReport,
    assessment,
    evidenceHash,
    payload,
    deployPlan,
    verification,
    attestationVerification,
    localTransaction,
    dossier,
    settlementRunbook,
    productDepth
  };
}

export async function buildProofPayScenarioPackage(scenario: ScenarioKey) {
  const deal = seededDeals[0];
  const bundle = seededEvidenceBundles[scenario];
  const milestone = deal.milestones.find((item) => item.id === bundle.milestoneId);

  if (!milestone) {
    throw new Error(`No milestone found for scenario ${scenario}`);
  }

  return buildProofPayBundlePackage({
    deal,
    milestone,
    bundle,
    scenario
  });
}

export async function buildExternalProofPayPackage(bundle: EvidenceBundle) {
  const { deal, milestone } = createDealFromBundle(bundle);

  return buildProofPayBundlePackage({
    deal,
    milestone,
    bundle,
    scenario: "external"
  });
}
