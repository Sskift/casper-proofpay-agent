import { assessEvidence, createEvidenceHash, seededDeals, seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import {
  createCasperProofWorkbench,
  createAttestationPayload,
  createCasperDeployPlan,
  createCasperVerificationSummary,
  submitDemoAttestation,
  verifyCasperAttestation,
  type CasperAttestationPayload
} from "./index";

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
    expect(plan.readiness.find((item) => item.id === "testnet-account")?.status).toBe("ready");
    expect(plan.readiness.find((item) => item.id === "testnet-deploy")?.status).toBe("ready");
    expect(plan.deployment?.transactionHash).toBe(
      "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604"
    );
    expect(plan.deployment?.namedKey).toBe("proofpay_attestation_ms-delivery-acceptance");
    expect(plan.sessionArgs).toContain("milestone_id:string='ms-delivery-acceptance'");
    expect(plan.sessionArgs).toContain(`evidence_hash:string='${payload.evidenceHash}'`);
    expect(plan.cliCommand).toContain("casper-client put-transaction session");
    expect(plan.cliCommand).toContain("--wasm-path \"contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm\"");
    expect(plan.cliCommand).toContain("--standard-payment true");
    expect(plan.cliCommand).toContain("--install-upgrade");
    expect(plan.postFundingCommands).toEqual([
      "npm run casper:check",
      "PROOFPAY_SCENARIO=\"clean\" npm run contract:deploy:testnet"
    ]);
  });

  it("summarizes recorded clean Testnet proof for the dashboard", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
    const plan = createCasperDeployPlan({ payload, scenario: "clean" });

    const summary = createCasperVerificationSummary(plan);

    expect(summary.state).toBe("recorded");
    expect(summary.label).toBe("Verified on Casper Testnet");
    expect(summary.primaryHash).toBe(plan.deployment?.transactionHash);
    expect(summary.network).toBe("Casper Testnet");
    expect(summary.checkedAt).toBe(plan.deployment?.submittedAt);
  });

  it("summarizes hold and reject scenarios as recorded Testnet deployments", () => {
    const milestone = seededDeals[0].milestones[0];

    for (const scenario of ["amountMismatch", "duplicateInvoice"] as const) {
      const bundle = seededEvidenceBundles[scenario];
      const assessment = assessEvidence(bundle);
      const evidenceHash = createEvidenceHash(bundle);
      const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
      const plan = createCasperDeployPlan({ payload, scenario });

      const summary = createCasperVerificationSummary(plan);

      expect(summary.state).toBe("recorded");
      expect(summary.label).toBe("Verified on Casper Testnet");
      expect(summary.primaryHash).toBe(plan.deployment?.transactionHash);
      expect(plan.readiness.find((item) => item.id === "testnet-deploy")?.status).toBe("ready");
    }
  });

  it("verifies a recorded Casper deployment against the current payload", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
    const plan = createCasperDeployPlan({ payload, scenario: "clean" });

    const report = verifyCasperAttestation({ payload, deployment: plan.deployment });

    expect(report.status).toBe("verified");
    expect(report.checks.every((check) => check.status === "passed")).toBe(true);
    expect(report.summary).toContain("recorded Testnet transaction matches");
  });

  it("recognizes the fresh video-integrated real case deployment", () => {
    const payload: CasperAttestationPayload = {
      schemaVersion: "proofpay.attestation.v1",
      attestationId: "att-ms-video-fresh-delivery-acceptance-assessment-realcase-video-coldchain-2026-06-26-approve",
      milestoneId: "ms-video-fresh-delivery-acceptance",
      dealId: "deal-vaccine-lane-043",
      evidenceHash: "0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803",
      decision: "approve",
      decisionHash: "0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d",
      confidence: 94,
      riskScore: 12,
      riskFlags: [],
      agentId: "proofpay-agent-v1",
      assessedAt: "2026-06-26T11:00:00.000Z",
      amount: 46500,
      currency: "USD"
    };
    const plan = createCasperDeployPlan({ payload, scenario: "realCase" });
    const report = verifyCasperAttestation({ payload, deployment: plan.deployment });

    expect(plan.deployment?.transactionHash).toBe(
      "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca"
    );
    expect(plan.deployment?.namedKey).toBe("proofpay_attestation_ms-video-fresh-delivery-acceptance");
    expect(plan.readiness.find((item) => item.id === "testnet-deploy")?.status).toBe("ready");
    expect(report.status).toBe("verified");
    expect(report.checks.every((check) => check.status === "passed")).toBe(true);
  });

  it("builds judge-facing Casper proof links, copy fields, and verification states", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.duplicateInvoice);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.duplicateInvoice);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
    const plan = createCasperDeployPlan({ payload, scenario: "duplicateInvoice" });

    const workbench = createCasperProofWorkbench({ payload, deployPlan: plan });

    expect(workbench.explorerUrl).toBe(
      "https://testnet.cspr.live/transaction/08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885"
    );
    expect(workbench.copyFields.map((field) => field.id)).toEqual([
      "transaction-hash",
      "evidence-hash",
      "decision-hash",
      "stored-uref",
      "replay-command"
    ]);
    expect(workbench.copyFields.find((field) => field.id === "evidence-hash")?.value).toBe(payload.evidenceHash);
    expect(workbench.copyFields.find((field) => field.id === "replay-command")?.value).toContain(
      "casper-client put-transaction session"
    );
    expect(workbench.verificationStates.map((state) => [state.id, state.status])).toEqual([
      ["transaction-recorded", "passed"],
      ["payload-hash-matches", "passed"],
      ["named-key-documented", "passed"],
      ["stored-uref-documented", "passed"]
    ]);
    expect(workbench.docsLinks).toEqual([
      { label: "Casper Testnet notes", href: "docs/casper-testnet.md" },
      { label: "Casper CLI runbook", href: "docs/casper-cli-runbook.md" }
    ]);
  });

  it("flags Casper proof mismatches", () => {
    const milestone = seededDeals[0].milestones[0];
    const assessment = assessEvidence(seededEvidenceBundles.clean);
    const evidenceHash = createEvidenceHash(seededEvidenceBundles.clean);
    const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
    const plan = createCasperDeployPlan({ payload, scenario: "clean" });

    const report = verifyCasperAttestation({
      payload,
      deployment: plan.deployment
        ? {
            ...plan.deployment,
            decisionHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
          }
        : null
    });

    expect(report.status).toBe("mismatch");
    expect(report.checks.find((check) => check.id === "decision-hash")?.status).toBe("failed");
  });
});
