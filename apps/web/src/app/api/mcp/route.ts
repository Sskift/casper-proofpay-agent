import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    schemaVersion: "proofpay.mcp.manifest.v1",
    name: "ProofPay Agent MCP",
    description: "Demo MCP-style manifest for RWA milestone evidence assessment and Casper attestation lookup.",
    tools: [
      {
        name: "assess_milestone_evidence",
        description: "Assess a seeded RWA evidence bundle and return the ProofPay agent decision package.",
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
        endpoint: "/api/attestation/{scenario}"
      },
      {
        name: "get_casper_attestation",
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
        endpoint: "/api/attestation/{scenario}"
      }
    ],
    honestyNote:
      "This is a hackathon demo manifest, not a hosted MCP server session. The endpoints are runnable and deterministic."
  });
}
