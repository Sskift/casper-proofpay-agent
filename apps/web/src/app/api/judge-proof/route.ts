import { NextResponse } from "next/server";

import { buildProofPayScenarioPackage } from "../proofpay-data";

export const dynamic = "force-dynamic";

const publicBaseUrl = "https://casper-proofpay-agent-web.vercel.app";
const githubBaseUrl = "https://github.com/Sskift/casper-proofpay-agent";
const testnetExplorerBaseUrl = "https://testnet.cspr.live/transaction";

const scenarioLabels = {
  clean: "Clean release",
  amountMismatch: "Hold for finance",
  duplicateInvoice: "Reject duplicate"
} as const;

const freshRealCase = {
  caseId: "realcase-video-coldchain-2026-06-26",
  caseFile: "examples/video-integrated-cold-chain-real-case.json",
  decision: "approve",
  riskScore: 12,
  confidence: 94,
  transactionHash: "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca",
  blockHeight: 8305098,
  namedKey: "proofpay_attestation_ms-video-fresh-delivery-acceptance",
  storedURef: "uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007",
  evidenceHash: "0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803",
  decisionHash: "0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d",
  verification: "verified",
  explorerUrl:
    "https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca",
  docs: `${githubBaseUrl}/blob/main/docs/real-case-execution.md`
};

export async function GET() {
  const seededScenarios = await Promise.all(
    (["clean", "amountMismatch", "duplicateInvoice"] as const).map(async (scenario) => {
      const proofPackage = await buildProofPayScenarioPackage(scenario);
      const deployment = proofPackage.deployPlan.deployment;

      return {
        scenario,
        label: scenarioLabels[scenario],
        decision: proofPackage.assessment.decision,
        riskScore: proofPackage.assessment.riskScore,
        confidence: proofPackage.assessment.confidence,
        evidenceHash: proofPackage.payload.evidenceHash,
        decisionHash: proofPackage.payload.decisionHash,
        attestationVerification: proofPackage.attestationVerification.status,
        transactionHash: deployment?.transactionHash ?? null,
        explorerUrl: deployment ? `${testnetExplorerBaseUrl}/${deployment.transactionHash}` : null,
        blockHeight: deployment?.blockHeight ?? null,
        namedKey: deployment?.namedKey ?? null,
        storedURef: deployment?.uref ?? null
      };
    })
  );

  return NextResponse.json({
    schemaVersion: "proofpay.api.judgeProof.v1",
    status: "ok",
    generatedAt: new Date().toISOString(),
    links: {
      liveDemo: publicBaseUrl,
      staticBackup: "https://sskift.github.io/casper-proofpay-agent/",
      demoVideo: "https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4",
      doraHacksBuidl: "https://dorahacks.io/buidl/45992",
      githubRepo: githubBaseUrl,
      judgeProofPack: `${githubBaseUrl}/blob/main/docs/judge-proof-pack.md`,
      submissionVerificationLog: `${githubBaseUrl}/blob/main/docs/submission-verification-log.md`,
      apiHealth: `${publicBaseUrl}/api/health`,
      apiJudgeProof: `${publicBaseUrl}/api/judge-proof`,
      apiEvidenceIntake: `${publicBaseUrl}/api/evidence/intake`,
      apiRealCasePrepare: `${publicBaseUrl}/api/real-case/prepare`
    },
    boundary: {
      real: [
        "Full-stack Vercel demo with public API routes.",
        "Recorded Casper Testnet attestations for clean, hold, reject, and the fresh real case.",
        "Fresh real case signed locally from a funded Casper Testnet key."
      ],
      simulated: [
        "No production custody of real funds.",
        "Seeded judge scenarios use synthetic evidence for repeatable demonstration."
      ],
      localOnly: [
        "New Casper Testnet submissions require a local funded key and local signing.",
        "The ignored MP4 render remains local; DoraHacks uses the Vercel-hosted video URL."
      ]
    },
    casperProofs: {
      seededScenarios,
      freshRealCase
    }
  });
}
