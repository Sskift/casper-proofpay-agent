import { seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import { GET as getAttestation } from "./attestation/[scenario]/route";
import { POST as postEvidenceIntake } from "./evidence/intake/route";
import { GET as getHealth } from "./health/route";
import { GET as getJudgeProof } from "./judge-proof/route";
import { POST as postRealCasePrepare } from "./real-case/prepare/route";

function jsonRequest(body: unknown) {
  return new Request("http://127.0.0.1:3000/api/evidence/intake", {
    method: "POST",
    headers: {
      "content-type": "application/json"
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
