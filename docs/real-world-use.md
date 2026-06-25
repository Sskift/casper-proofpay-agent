# ProofPay Real-World Use Path

ProofPay's core advantage is not the dashboard itself. The dashboard is the operator surface for a payment decision chain:

```text
external evidence -> intake validation -> agent policy decision -> evidence hash
-> decision hash -> Casper attestation verification -> release / hold / dispute action
-> portable audit dossier
```

## Practical Problem

RWA milestone payments have a trust gap:

- Buyers do not want funds released before delivery evidence is proven.
- Suppliers do not want payment delays after delivery.
- AI can review evidence quickly, but an unverified AI answer is hard to trust.
- Auditors and arbiters need a replayable trail when a payment is challenged.

ProofPay closes that gap by separating speed, control, and trust anchoring:

- AI accelerates evidence review.
- Humans keep release authority.
- Casper anchors the decision hash and evidence hash.
- The dossier lets a third party replay the assessment.

## Real User Flow

1. Supplier submits a normalized evidence pack.
2. ProofPay validates required documents and extracted claims.
3. The agent checks amount, currency, shipment identity, delivery confirmation, cold-chain bounds, counterparty registry, and duplicate invoice evidence.
4. ProofPay returns `approve`, `hold`, or `reject` with reasons and follow-up actions.
5. The app creates an evidence hash and decision hash.
6. Casper records or verifies the attestation payload.
7. Buyer signs release, buyer finance resolves a hold, or an arbiter opens a dispute.
8. The audit dossier is exported to the buyer, supplier, lender, insurer, or judge.

## What Is Now Implemented

- `inspectEvidenceIntake` checks whether the evidence pack is complete enough for assessment.
- `parseEvidenceBundle` validates external JSON evidence before it reaches the agent.
- `createSettlementRunbook` converts an AI decision into supplier, buyer, arbiter, and Casper actions.
- `verifyCasperAttestation` compares the current payload against recorded Casper Testnet facts.
- `POST /api/evidence/intake` accepts an external evidence bundle and returns the report, assessment, payload, verifier result, runbook, and dossier.
- `/api/attestation/{scenario}` returns the seeded judge package with the same practical objects.
- `/api/mcp` describes both seeded assessment and external evidence intake tools.
- `/api/x402/release-decision` returns the decision package after the demo payment-required handshake.

## API Shape

External evidence intake:

```http
POST /api/evidence/intake
content-type: application/json
```

Expected top-level fields, shortened here to one document for readability:

```json
{
  "id": "bundle-real-shipment-001",
  "dealId": "deal-real-shipment-001",
  "milestoneId": "ms-delivery-acceptance",
  "submittedBy": "Supplier name",
  "submittedAt": "2026-06-25T10:00:00.000Z",
  "summary": "Delivery evidence for one milestone.",
  "expected": {
    "buyer": "Buyer name",
    "supplier": "Supplier name",
    "amount": 42000,
    "currency": "USD",
    "shipmentId": "SHIP-001",
    "temperatureMinC": 2,
    "temperatureMaxC": 8
  },
  "documents": [
    {
      "id": "doc-invoice-001",
      "type": "invoice",
      "title": "Invoice INV-001",
      "issuedAt": "2026-06-25T09:00:00.000Z",
      "fingerprint": "sha256-or-upstream-document-fingerprint",
      "claims": {
        "amount": 42000,
        "currency": "USD",
        "shipmentId": "SHIP-001",
        "buyer": "Buyer name",
        "supplier": "Supplier name"
      }
    }
  ]
}
```

Required document types:

- `invoice`
- `bill_of_lading`
- `delivery_note`
- `temperature_log`
- `vendor_registry`

The endpoint returns `422` when required metadata or evidence is missing. When accepted, it returns:

- `report`: intake coverage and issues.
- `assessment`: agent decision, risk score, reasons, and follow-up.
- `payload`: Casper attestation payload with evidence and decision hashes.
- `attestationVerification`: payload-to-Testnet verification checks.
- `settlementRunbook`: next actions for supplier, buyer, arbiter, and Casper.
- `dossier`: portable audit package.

## Production Integration Path

ProofPay can be used as an embedded verification layer for:

- Cross-border trade milestone escrow.
- Cold-chain logistics payments.
- Supplier invoice financing.
- Insurance claim pre-checks.
- DAO or treasury conditional payment workflows.

A production deployment would add:

- Authenticated parties and role permissions.
- Native document upload and OCR or extraction pipeline.
- Wallet signing for buyer release approval.
- Direct Casper state query against the live transaction and URef instead of recorded demo facts.
- Payment rail integration after human approval.
- Persistent evidence storage with privacy controls.

## Current Boundary

This buildathon prototype does not custody real funds and does not claim production-grade OCR, identity verification, or payment settlement. It proves the harder product path: an external evidence package can be validated, assessed, hashed, converted into human-operable settlement actions, and matched against Casper attestation facts.
