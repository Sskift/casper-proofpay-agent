import { NextResponse } from "next/server";

import { parseEvidenceBundle } from "@proofpay/agent";

import { buildExternalProofPayPackage, buildProofPayScenarioPackage, isScenarioKey } from "../proofpay-data";
import { createSettlementInstruction } from "../settlement-instruction";

export function GET() {
  return NextResponse.json({
    schemaVersion: "proofpay.mcp.manifest.v1",
    name: "ProofPay Agent MCP",
    description: "Demo MCP-style manifest for RWA milestone evidence assessment and Casper attestation lookup.",
    tools: [
      {
        name: "proofpay.assessEvidence",
        description: "Assess a seeded or external RWA evidence bundle and return the ProofPay agent decision package.",
        inputSchema: {
          type: "object",
          properties: {
            scenario: {
              type: "string",
              enum: ["clean", "amountMismatch", "duplicateInvoice"]
            },
            evidence: { type: "object" }
          }
        },
        endpoint: "POST /api/mcp"
      },
      {
        name: "proofpay.getJudgeProof",
        description: "Return the Casper Testnet verification summary and deploy-readiness gates for a scenario.",
        inputSchema: {
          type: "object",
          properties: {
            scenario: {
              type: "string",
              enum: ["clean", "amountMismatch", "duplicateInvoice"]
            }
          },
          required: ["scenario"]
        },
        endpoint: "POST /api/mcp"
      },
      {
        name: "proofpay.getSettlementInstruction",
        description: "Return the human-controlled settlement instruction derived from a ProofPay decision.",
        inputSchema: {
          type: "object",
          properties: {
            scenario: {
              type: "string",
              enum: ["clean", "amountMismatch", "duplicateInvoice"]
            },
            evidence: { type: "object" }
          }
        },
        endpoint: "POST /api/mcp"
      }
    ],
    honestyNote:
      "This is a hackathon MCP-style HTTP tool surface. The POST endpoint is runnable and deterministic; it is not a production hosted MCP session."
  });
}

type McpTool = "proofpay.assessEvidence" | "proofpay.getJudgeProof" | "proofpay.getSettlementInstruction";

interface McpRequest {
  tool?: McpTool;
  input?: {
    scenario?: string;
    evidence?: unknown;
  };
}

async function proofPackageFromInput(input: McpRequest["input"]) {
  if (input?.evidence) {
    const parsed = parseEvidenceBundle(input.evidence);

    if (!parsed.ok) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            schemaVersion: "proofpay.mcp.toolResult.v1",
            accepted: false,
            report: parsed.report
          },
          { status: 422 }
        )
      };
    }

    return {
      ok: true as const,
      proofPackage: await buildExternalProofPayPackage(parsed.bundle)
    };
  }

  const scenario = input?.scenario ?? "clean";

  if (!isScenarioKey(scenario)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          schemaVersion: "proofpay.mcp.toolResult.v1",
          error: "unknown_scenario",
          allowedScenarios: ["clean", "amountMismatch", "duplicateInvoice"]
        },
        { status: 400 }
      )
    };
  }

  return {
    ok: true as const,
    proofPackage: await buildProofPayScenarioPackage(scenario)
  };
}

export async function POST(request: Request) {
  let body: McpRequest;

  try {
    body = (await request.json()) as McpRequest;
  } catch {
    return NextResponse.json(
      {
        error: "invalid_json",
        message: "Request body must be valid JSON."
      },
      { status: 400 }
    );
  }

  if (
    body.tool !== "proofpay.assessEvidence" &&
    body.tool !== "proofpay.getJudgeProof" &&
    body.tool !== "proofpay.getSettlementInstruction"
  ) {
    return NextResponse.json(
      {
        schemaVersion: "proofpay.mcp.toolResult.v1",
        error: "unknown_tool",
        allowedTools: ["proofpay.assessEvidence", "proofpay.getJudgeProof", "proofpay.getSettlementInstruction"]
      },
      { status: 400 }
    );
  }

  const packageResult = await proofPackageFromInput(body.input);

  if (!packageResult.ok) {
    return packageResult.response;
  }

  const { proofPackage } = packageResult;
  const settlementInstruction = createSettlementInstruction({
    decision: proofPackage.assessment.decision,
    settlementRunbook: proofPackage.settlementRunbook
  });

  const result =
    body.tool === "proofpay.getJudgeProof"
      ? {
          scenario: proofPackage.scenario,
          assessment: proofPackage.assessment,
          payload: proofPackage.payload,
          casper: {
            verification: proofPackage.verification,
            attestationVerification: proofPackage.attestationVerification,
            deployment: proofPackage.deployPlan.deployment
          }
        }
      : body.tool === "proofpay.getSettlementInstruction"
        ? {
            scenario: proofPackage.scenario,
            assessment: proofPackage.assessment,
            settlementInstruction,
            payload: proofPackage.payload
          }
        : {
            scenario: proofPackage.scenario,
            assessment: proofPackage.assessment,
            payload: proofPackage.payload,
            settlementInstruction,
            dossier: proofPackage.dossier
          };

  return NextResponse.json({
    schemaVersion: "proofpay.mcp.toolResult.v1",
    tool: body.tool,
    result
  });
}
