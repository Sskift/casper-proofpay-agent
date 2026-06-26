import { seededEvidenceBundles } from "@proofpay/agent";
import { describe, expect, it } from "vitest";

import { GET as getAttestation } from "./attestation/[scenario]/route";
import { POST as postEvidenceIntake } from "./evidence/intake/route";

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
