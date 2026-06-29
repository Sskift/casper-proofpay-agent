import { seededEvidenceBundles } from "@proofpay/agent";

type JsonObject = Record<string, unknown>;

const rawBaseUrl = process.argv[2] ?? process.env.PROOFPAY_BASE_URL ?? "http://127.0.0.1:3000";
const baseUrl = rawBaseUrl.replace(/\/$/, "");

async function readJson(response: Response): Promise<JsonObject> {
  const text = await response.text();

  try {
    return JSON.parse(text) as JsonObject;
  } catch {
    throw new Error(`Expected JSON from ${response.url}, received: ${text.slice(0, 160)}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      accept: "application/json"
    }
  });
  const body = await readJson(response);
  return { response, body };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const responseBody = await readJson(response);
  return { response, body: responseBody };
}

async function postJsonWithHeaders(path: string, body: unknown, headers: Record<string, string>) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
  const responseBody = await readJson(response);
  return { response, body: responseBody };
}

async function postRaw(path: string, body: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body
  });
  const responseBody = await readJson(response);
  return { response, body: responseBody };
}

async function main() {
  const health = await fetchJson("/api/health");
  assert(health.response.status === 200, `GET /api/health returned ${health.response.status}`);
  assert(health.body.schemaVersion === "proofpay.api.health.v1", "Health schema version mismatch");
  assert(health.body.status === "ok", "Health status was not ok");
  assert(
    Array.isArray(health.body.routes) && health.body.routes.includes("GET /api/judge-proof"),
    "Health route does not advertise judge proof API"
  );
  assert(
    Array.isArray(health.body.routes) && health.body.routes.includes("POST /api/x402/proof-review"),
    "Health route does not advertise x402 proof review API"
  );
  assert(
    Array.isArray(health.body.routes) && health.body.routes.includes("POST /api/mcp"),
    "Health route does not advertise MCP tool invocation API"
  );
  assert(
    Array.isArray(health.body.routes) && health.body.routes.includes("POST /api/settlement-adapter"),
    "Health route does not advertise settlement adapter API"
  );

  const attestation = await fetchJson("/api/attestation/clean");
  const attestationAssessment = attestation.body.assessment as JsonObject | undefined;
  const attestationDeployPlan = attestation.body.deployPlan as JsonObject | undefined;
  const attestationDeployment = attestationDeployPlan?.deployment as JsonObject | undefined;
  assert(attestation.response.status === 200, `GET /api/attestation/clean returned ${attestation.response.status}`);
  assert(attestationAssessment?.decision === "approve", "Clean attestation did not approve");
  assert(
    attestationDeployment?.transactionHash === "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604",
    "Clean attestation transaction hash mismatch"
  );

  const judgeProof = await fetchJson("/api/judge-proof");
  const judgeProofLinks = judgeProof.body.links as JsonObject | undefined;
  const judgeProofCasper = judgeProof.body.casperProofs as JsonObject | undefined;
  const judgeProofFreshCase = judgeProofCasper?.freshRealCase as JsonObject | undefined;
  assert(judgeProof.response.status === 200, `GET /api/judge-proof returned ${judgeProof.response.status}`);
  assert(judgeProof.body.schemaVersion === "proofpay.api.judgeProof.v1", "Judge proof schema version mismatch");
  assert(
    judgeProofLinks?.demoVideo === "https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4",
    "Judge proof demo video link mismatch"
  );
  assert(
    judgeProofFreshCase?.transactionHash === "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca",
    "Judge proof fresh case transaction mismatch"
  );

  const duplicateIntake = await postJson("/api/evidence/intake", seededEvidenceBundles.duplicateInvoice);
  const duplicateAssessment = duplicateIntake.body.assessment as JsonObject | undefined;
  assert(duplicateIntake.response.status === 200, `POST /api/evidence/intake returned ${duplicateIntake.response.status}`);
  assert(duplicateIntake.body.accepted === true, "Duplicate intake was not accepted");
  assert(duplicateAssessment?.decision === "reject", "Duplicate intake did not reject");
  assert(duplicateAssessment?.riskScore === 88, "Duplicate intake risk score mismatch");

  const unpaidProofReview = await postJson("/api/x402/proof-review", seededEvidenceBundles.clean);
  assert(unpaidProofReview.response.status === 402, `Unpaid x402 proof review returned ${unpaidProofReview.response.status}`);
  assert(unpaidProofReview.body.paymentRequired === true, "Unpaid x402 proof review should require payment");

  const paidProofReview = await postJsonWithHeaders(
    "/api/x402/proof-review",
    seededEvidenceBundles.duplicateInvoice,
    { "x-proofpay-demo-paid": "true" }
  );
  const paidProofAssessment = paidProofReview.body.assessment as JsonObject | undefined;
  const paidProofInstruction = paidProofReview.body.settlementInstruction as JsonObject | undefined;
  assert(paidProofReview.response.status === 200, `Paid x402 proof review returned ${paidProofReview.response.status}`);
  assert(paidProofReview.body.schemaVersion === "proofpay.x402.proofReview.v1", "Paid x402 proof review schema mismatch");
  assert(paidProofAssessment?.decision === "reject", "Paid x402 proof review did not reject duplicate evidence");
  assert(paidProofInstruction?.state === "dispute-blocked", "Paid x402 proof review settlement state mismatch");

  const mcpSettlement = await postJson("/api/mcp", {
    tool: "proofpay.getSettlementInstruction",
    input: {
      scenario: "amountMismatch"
    }
  });
  const mcpSettlementResult = mcpSettlement.body.result as JsonObject | undefined;
  const mcpSettlementAssessment = mcpSettlementResult?.assessment as JsonObject | undefined;
  const mcpSettlementInstruction = mcpSettlementResult?.settlementInstruction as JsonObject | undefined;
  assert(mcpSettlement.response.status === 200, `MCP settlement tool returned ${mcpSettlement.response.status}`);
  assert(mcpSettlement.body.schemaVersion === "proofpay.mcp.toolResult.v1", "MCP tool result schema mismatch");
  assert(mcpSettlementAssessment?.decision === "hold", "MCP settlement tool did not hold amount mismatch");
  assert(mcpSettlementInstruction?.state === "finance-review", "MCP settlement tool state mismatch");

  const settlementAdapter = await postJson("/api/settlement-adapter", seededEvidenceBundles.clean);
  const settlementInstruction = settlementAdapter.body.settlementInstruction as JsonObject | undefined;
  assert(settlementAdapter.response.status === 200, `Settlement adapter returned ${settlementAdapter.response.status}`);
  assert(settlementAdapter.body.schemaVersion === "proofpay.api.settlementAdapter.v1", "Settlement adapter schema mismatch");
  assert(settlementInstruction?.state === "release-ready", "Settlement adapter clean state mismatch");

  const invalidJson = await postRaw("/api/evidence/intake", "{ invalid json");
  assert(invalidJson.response.status === 400, `Invalid JSON returned ${invalidJson.response.status}`);
  assert(invalidJson.body.error === "invalid_json", "Invalid JSON error code mismatch");

  const incompleteBundle = {
    ...seededEvidenceBundles.clean,
    documents: seededEvidenceBundles.clean.documents.filter((document) => document.type !== "delivery_note")
  };
  const incompleteIntake = await postJson("/api/evidence/intake", incompleteBundle);
  const incompleteReport = incompleteIntake.body.report as JsonObject | undefined;
  assert(incompleteIntake.response.status === 422, `Incomplete evidence returned ${incompleteIntake.response.status}`);
  assert(incompleteIntake.body.accepted === false, "Incomplete evidence should not be accepted");
  assert(incompleteReport?.status === "blocked", "Incomplete evidence report should be blocked");

  const realCasePrepare = await postJson("/api/real-case/prepare", {
    ...seededEvidenceBundles.clean,
    id: "realcase-smoke-001",
    dealId: "deal-realcase-smoke-001",
    milestoneId: "ms-realcase-smoke-001",
    scenario: "realCase"
  });
  const realCasePayload = realCasePrepare.body.payload as JsonObject | undefined;
  const realCaseVerification = realCasePrepare.body.attestationVerification as JsonObject | undefined;
  assert(realCasePrepare.response.status === 200, `POST /api/real-case/prepare returned ${realCasePrepare.response.status}`);
  assert(realCasePrepare.body.accepted === true, "Real case prepare was not accepted");
  assert(realCasePayload?.milestoneId === "ms-realcase-smoke-001", "Real case milestone did not round-trip");
  assert(realCaseVerification?.status === "pending", "Real case prepare should be pending before deploy");

  console.log(JSON.stringify({
    baseUrl,
    status: "ok",
    checks: {
      health: health.body.schemaVersion,
      cleanAttestation: {
        decision: attestationAssessment.decision,
        transactionHash: attestationDeployment.transactionHash
      },
      judgeProof: {
        demoVideo: judgeProofLinks.demoVideo,
        freshCaseTransaction: judgeProofFreshCase.transactionHash
      },
      duplicateIntake: {
        decision: duplicateAssessment.decision,
        riskScore: duplicateAssessment.riskScore
      },
      x402ProofReview: {
        unpaid: unpaidProofReview.response.status,
        paidDecision: paidProofAssessment.decision,
        settlementState: paidProofInstruction.state
      },
      mcpSettlement: {
        decision: mcpSettlementAssessment.decision,
        settlementState: mcpSettlementInstruction.state
      },
      settlementAdapter: {
        settlementState: settlementInstruction.state
      },
      realCasePrepare: {
        milestoneId: realCasePayload.milestoneId,
        attestationVerification: realCaseVerification.status
      },
      invalidJson: invalidJson.response.status,
      incompleteEvidence: incompleteIntake.response.status
    }
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
