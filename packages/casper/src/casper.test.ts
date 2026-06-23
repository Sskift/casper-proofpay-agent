import { assessEvidence, createEvidenceHash, seededDeals, seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import { createAttestationPayload, createCasperDeployPlan, submitDemoAttestation } from "./index";

describe("ProofPay Casper adapter", () => {
  it("creates hashable attestation payloads from agent assessments", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);

    const payload = createAttestationPayload({
      milestone,
      evidenceHash,
      assessment
    });

    expect(payload.milestoneId).toBe("ms-delivery-acceptance");
    expect(payload.decision).toBe("approve");
    expect(payload.confidence).toBeGreaterThanOrEqual(90);
    expect(payload.decisionHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(payload.agentId).toBe("proofpay-agent-v1");
  });

  it("submits deterministic demo transactions labeled as Casper testnet demo", async () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });

    const first = await submitDemoAttestation(payload);
    const second = await submitDemoAttestation(payload);

    expect(first.hash).toBe(second.hash);
    expect(first.hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.network).toBe("casper-testnet-demo");
    expect(first.explorerUrl).toBeNull();
    expect(first.status).toBe("accepted");
  });

  it("creates a Casper 5 deploy plan with copy-ready session args", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });

    const plan = createCasperDeployPlan({
      payload,
      scenario: "clean",
      wasmPath: "contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm",
      secretKeyPath: "$HOME/.casper/proofpay-testnet-20260623/secret_key.pem"
    });

    expect(plan.nodeAddress).toBe("https://node.testnet.casper.network");
    expect(plan.chainName).toBe("casper-test");
    expect(plan.publicKeyHex).toBe("01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e");
    expect(plan.accountHash).toBe("account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d");
    expect(plan.faucetUrl).toBe("https://testnet.cspr.live/tools/faucet");
    expect(plan.readiness.find((item) => item.id === "testnet-account")?.status).toBe("blocked");
    expect(plan.sessionArgs).toContain("milestone_id:string='ms-delivery-acceptance'");
    expect(plan.sessionArgs).toContain(`evidence_hash:string='${payload.evidenceHash}'`);
    expect(plan.cliCommand).toContain("casper-client put-transaction session");
    expect(plan.cliCommand).toContain("--wasm-path \"contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm\"");
    expect(plan.cliCommand).toContain("--install-upgrade");
    expect(plan.postFundingCommands).toEqual([
      "npm run casper:check",
      "PROOFPAY_SCENARIO=\"clean\" npm run contract:deploy:testnet"
    ]);
  });
});
