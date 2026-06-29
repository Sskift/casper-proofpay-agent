import { seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import { GET as getAttestation } from "./attestation/[scenario]/route";
import { POST as postEvidenceIntake } from "./evidence/intake/route";
import { GET as getHealth } from "./health/route";
import { GET as getJudgeProof } from "./judge-proof/route";
import { GET as getMcp, POST as postMcp } from "./mcp/route";
import { POST as postRealCasePrepare } from "./real-case/prepare/route";
import { POST as postSettlementAdapter } from "./settlement-adapter/route";
import { POST as postX402ProofReview } from "./x402/proof-review/route";

function jsonRequest(body: unknown) {
  return new Request("http://127.0.0.1:3000/api/evidence/intake", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function jsonRequestTo(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe("ProofPay API routes", () => {
  it("reports full-stack API readiness from the health route", async () => {
    const response = await getHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.health.v1");
    expect(body.status).toBe("ok");
    expect(body.boundary.noCustody).toBe(true);
    expect(body.routes).toContain("GET /api/attestation/clean");
    expect(body.routes).toContain("POST /api/evidence/intake");
    expect(body.routes).toContain("POST /api/real-case/prepare");
    expect(body.routes).toContain("GET /api/judge-proof");
    expect(body.routes).toContain("POST /api/x402/proof-review");
    expect(body.routes).toContain("POST /api/mcp");
    expect(body.routes).toContain("POST /api/settlement-adapter");
    expect(body.casperProofs.clean.transactionHash).toBe(
      "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604"
    );
  });

  it("returns a compact judge proof pack from the API", async () => {
    const response = await getJudgeProof();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.judgeProof.v1");
    expect(body.links.demoVideo).toBe("https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4");
    expect(body.boundary.real).toContain("Full-stack Vercel demo with public API routes.");
    expect(body.casperProofs.seededScenarios).toHaveLength(3);
    expect(
      body.casperProofs.seededScenarios.find((item: { scenario: string }) => item.scenario === "clean")?.transactionHash
    ).toBe("94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604");
    expect(body.casperProofs.freshRealCase.transactionHash).toBe(
      "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca"
    );
  });

  it("returns a recorded Casper proof package for a seeded scenario", async () => {
    const response = await getAttestation(new Request("http://127.0.0.1:3000/api/attestation/clean"), {
      params: {
        scenario: "clean"
      }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.attestation.v1");
    expect(body.assessment.decision).toBe("approve");
    expect(body.payload.evidenceHash).toBe("0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1");
    expect(body.deployPlan.deployment.transactionHash).toBe(
      "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604"
    );
    expect(body.attestationVerification.status).toBe("verified");
  });

  it("assesses external evidence through the intake route", async () => {
    const response = await postEvidenceIntake(jsonRequest(seededEvidenceBundles.duplicateInvoice));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.evidenceIntake.v1");
    expect(body.accepted).toBe(true);
    expect(body.assessment.decision).toBe("reject");
    expect(body.assessment.riskScore).toBe(88);
    expect(body.payload.evidenceHash).toBe("0x745f85d8760dde067cdf8b1e375139396e69bef7f40103209018acfea5c61ff9");
    expect(body.dossier.trace.find((step: { id: string; status: string }) => step.id === "duplicate-invoice")?.status).toBe("failed");
  });

  it("requires an x402-style paid handshake before proof review", async () => {
    const response = await postX402ProofReview(jsonRequestTo(
      "http://127.0.0.1:3000/api/x402/proof-review",
      seededEvidenceBundles.clean
    ));
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.schemaVersion).toBe("proofpay.x402.proofReviewPaymentRequired.v1");
    expect(body.paymentRequired).toBe(true);
    expect(body.acceptedPaymentHeader).toBe("x-proofpay-demo-paid: true");
    expect(body.service).toBe("proofpay.proofReview");
  });

  it("returns a paid x402 proof review package for external evidence", async () => {
    const response = await postX402ProofReview(jsonRequestTo(
      "http://127.0.0.1:3000/api/x402/proof-review",
      seededEvidenceBundles.duplicateInvoice,
      { "x-proofpay-demo-paid": "true" }
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.x402.proofReview.v1");
    expect(body.paymentRequired).toBe(false);
    expect(body.x402.status).toBe("demo-paid");
    expect(body.assessment.decision).toBe("reject");
    expect(body.payload.decisionHash).toBe("0x95e24b90c3d51d52cd5babe1eaa3accb2d478c654f57ca7bb479b17cb515aa34");
    expect(body.settlementInstruction.state).toBe("dispute-blocked");
    expect(body.casper.attestationVerification).toBe("verified");
    expect(body.casper.nextStep).toContain("recorded Casper Testnet transaction");
  });

  it("invokes MCP-style ProofPay tools over POST", async () => {
    const manifestResponse = await getMcp();
    const manifest = await manifestResponse.json();

    expect(manifest.tools.map((tool: { name: string }) => tool.name)).toContain("proofpay.assessEvidence");
    expect(manifest.tools.map((tool: { name: string }) => tool.name)).toContain("proofpay.getSettlementInstruction");

    const response = await postMcp(jsonRequestTo("http://127.0.0.1:3000/api/mcp", {
      tool: "proofpay.getSettlementInstruction",
      input: {
        scenario: "amountMismatch"
      }
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.mcp.toolResult.v1");
    expect(body.tool).toBe("proofpay.getSettlementInstruction");
    expect(body.result.assessment.decision).toBe("hold");
    expect(body.result.settlementInstruction.state).toBe("finance-review");
  });

  it("adapts evidence decisions into human-controlled settlement instructions", async () => {
    const response = await postSettlementAdapter(jsonRequestTo(
      "http://127.0.0.1:3000/api/settlement-adapter",
      seededEvidenceBundles.clean
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.settlementAdapter.v1");
    expect(body.settlementInstruction.state).toBe("release-ready");
    expect(body.settlementInstruction.humanApprovalRequired).toBe(true);
    expect(body.boundary.noCustody).toBe(true);
    expect(body.casperAttestation.payloadHash).toBe("0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1");
  });

  it("prepares a new real case payload without a recorded deployment", async () => {
    const response = await postRealCasePrepare(jsonRequest({
      ...seededEvidenceBundles.clean,
      id: "realcase-api-001",
      dealId: "deal-realcase-api-001",
      milestoneId: "ms-realcase-api-001",
      scenario: "realCase"
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schemaVersion).toBe("proofpay.api.realCasePrepare.v1");
    expect(body.accepted).toBe(true);
    expect(body.payload.milestoneId).toBe("ms-realcase-api-001");
    expect(body.attestationVerification.status).toBe("pending");
    expect(body.deploy.cliCommand).toContain("casper-client put-transaction session");
    expect(body.deploy.cliCommand).toContain("$CASPER_SECRET_KEY");
  });

  it("returns friendly validation details for incomplete evidence", async () => {
    const response = await postEvidenceIntake(jsonRequest({
      ...seededEvidenceBundles.clean,
      documents: seededEvidenceBundles.clean.documents.filter((document) => document.type !== "delivery_note")
    }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.accepted).toBe(false);
    expect(body.report.status).toBe("blocked");
    expect(body.report.issues.map((issue: { field: string }) => issue.field)).toContain("documents.delivery_note");
  });
});
