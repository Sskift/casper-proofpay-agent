import type { CasperAttestationPayload, CasperDeploymentRecord } from "./types";

export type AttestationCheckStatus = "passed" | "failed" | "pending";
export type AttestationVerificationStatus = "verified" | "mismatch" | "pending";

export interface AttestationVerificationCheck {
  id: string;
  label: string;
  status: AttestationCheckStatus;
  expected: string;
  observed: string;
}

export interface AttestationVerificationReport {
  status: AttestationVerificationStatus;
  label: string;
  summary: string;
  checks: AttestationVerificationCheck[];
}

export interface VerifyCasperAttestationInput {
  payload: CasperAttestationPayload;
  deployment: CasperDeploymentRecord | null;
}

function check(
  id: string,
  label: string,
  expected: string | number,
  observed: string | number | undefined
): AttestationVerificationCheck {
  return {
    id,
    label,
    expected: String(expected),
    observed: observed === undefined ? "missing" : String(observed),
    status: observed === expected ? "passed" : "failed"
  };
}

export function verifyCasperAttestation({
  payload,
  deployment
}: VerifyCasperAttestationInput): AttestationVerificationReport {
  if (!deployment) {
    return {
      status: "pending",
      label: "No matching Casper deployment",
      summary: "The payload is ready, but no recorded Testnet deployment matches this evidence and decision hash yet.",
      checks: [
        {
          id: "deployment",
          label: "Casper deployment",
          status: "pending",
          expected: "transaction hash, named key, and stored URef",
          observed: "missing"
        }
      ]
    };
  }

  const checks = [
    check("milestone", "Milestone id", payload.milestoneId, deployment.milestoneId),
    check("evidence-hash", "Evidence hash", payload.evidenceHash, deployment.evidenceHash),
    check("decision", "Decision", payload.decision, deployment.decision),
    check("decision-hash", "Decision hash", payload.decisionHash, deployment.decisionHash),
    check("confidence", "Confidence", payload.confidence, deployment.confidence),
    check("risk-score", "Risk score", payload.riskScore, deployment.riskScore),
    {
      id: "transaction-hash",
      label: "Transaction hash",
      expected: "64-character Casper transaction hash",
      observed: deployment.transactionHash,
      status: /^[a-f0-9]{64}$/.test(deployment.transactionHash) ? "passed" : "failed"
    },
    {
      id: "stored-uref",
      label: "Stored URef",
      expected: "Casper URef",
      observed: deployment.uref,
      status: deployment.uref.startsWith("uref-") ? "passed" : "failed"
    }
  ] satisfies AttestationVerificationCheck[];
  const failed = checks.filter((item) => item.status === "failed");

  if (failed.length > 0) {
    return {
      status: "mismatch",
      label: "Casper proof mismatch",
      summary: `${failed.length} attestation fields do not match the current payload.`,
      checks
    };
  }

  return {
    status: "verified",
    label: "Casper proof matches",
    summary: "The recorded Testnet transaction matches the current evidence hash, decision hash, and stored attestation facts.",
    checks
  };
}
