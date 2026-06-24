import {
  assessEvidence,
  createAuditDossier,
  createEvidenceHash,
  createProductDepthModel,
  seededDeals,
  seededEvidenceBundles
} from "@proofpay/agent";
import {
  createAttestationPayload,
  createCasperDeployPlan,
  createCasperVerificationSummary,
  submitDemoAttestation
} from "@proofpay/casper";

export type ScenarioKey = keyof typeof seededEvidenceBundles;

export function isScenarioKey(value: string): value is ScenarioKey {
  return Object.prototype.hasOwnProperty.call(seededEvidenceBundles, value);
}

export async function buildProofPayScenarioPackage(scenario: ScenarioKey) {
  const deal = seededDeals[0];
  const bundle = seededEvidenceBundles[scenario];
  const milestone = deal.milestones.find((item) => item.id === bundle.milestoneId);

  if (!milestone) {
    throw new Error(`No milestone found for scenario ${scenario}`);
  }

  const assessment = assessEvidence(bundle);
  const evidenceHash = createEvidenceHash(bundle);
  const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
  const deployPlan = createCasperDeployPlan({ payload, scenario });
  const verification = createCasperVerificationSummary(deployPlan);
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
    assessment,
    evidenceHash,
    payload,
    deployPlan,
    verification,
    localTransaction,
    dossier,
    productDepth
  };
}
