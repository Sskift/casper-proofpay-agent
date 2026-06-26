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

  const duplicateIntake = await postJson("/api/evidence/intake", seededEvidenceBundles.duplicateInvoice);
  const duplicateAssessment = duplicateIntake.body.assessment as JsonObject | undefined;
  assert(duplicateIntake.response.status === 200, `POST /api/evidence/intake returned ${duplicateIntake.response.status}`);
  assert(duplicateIntake.body.accepted === true, "Duplicate intake was not accepted");
  assert(duplicateAssessment?.decision === "reject", "Duplicate intake did not reject");
  assert(duplicateAssessment?.riskScore === 88, "Duplicate intake risk score mismatch");

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

  console.log(JSON.stringify({
    baseUrl,
    status: "ok",
    checks: {
      health: health.body.schemaVersion,
      cleanAttestation: {
        decision: attestationAssessment.decision,
        transactionHash: attestationDeployment.transactionHash
      },
      duplicateIntake: {
        decision: duplicateAssessment.decision,
        riskScore: duplicateAssessment.riskScore
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
