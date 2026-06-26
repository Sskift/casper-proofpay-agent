import type { Deal, EvidenceBundle } from "./types";

type SeededScenario = "clean" | "amountMismatch" | "duplicateInvoice";

const expected = {
  buyer: "Northstar Health Cooperative",
  supplier: "Aster Cold Chain Logistics",
  amount: 42000,
  currency: "USD",
  shipmentId: "VX-2026-042",
  temperatureMinC: 2,
  temperatureMaxC: 8
};

export const seededDeals: Deal[] = [
  {
    id: "deal-vaccine-lane-042",
    name: "RWA Cold Chain Milestone Escrow",
    buyer: expected.buyer,
    supplier: expected.supplier,
    assetType: "Temperature-controlled vaccine shipment",
    jurisdiction: "Singapore to Istanbul trade lane",
    escrowAmount: 42000,
    currency: "USD",
    milestones: [
      {
        id: "ms-delivery-acceptance",
        dealId: "deal-vaccine-lane-042",
        title: "Release payment after verified cold-chain delivery",
        description:
          "Pay the supplier when invoice, bill of lading, temperature log, and delivery note agree on the shipment and amount.",
        amount: 42000,
        currency: "USD",
        dueDate: "2026-07-01",
        state: "awaiting_evidence",
        requiredEvidence: [
          "invoice",
          "bill_of_lading",
          "delivery_note",
          "temperature_log",
          "vendor_registry"
        ]
      }
    ]
  }
];

const cleanDocuments: EvidenceBundle["documents"] = [
  {
    id: "doc-invoice-clean",
    type: "invoice",
    title: "Invoice INV-8842",
    issuedAt: "2026-06-22T09:00:00.000Z",
    fingerprint: "fp-invoice-8842-a",
    claims: {
      invoiceId: "INV-8842",
      purchaseOrder: "PO-7718",
      buyer: expected.buyer,
      supplier: expected.supplier,
      amount: 42000,
      currency: "USD",
      shipmentId: expected.shipmentId,
      assetDescription: "2,400 vaccine packs in monitored cold-chain containers"
    }
  },
  {
    id: "doc-bol-clean",
    type: "bill_of_lading",
    title: "Bill of Lading BOL-2026-77",
    issuedAt: "2026-06-22T10:15:00.000Z",
    fingerprint: "fp-bol-2026-77",
    claims: {
      buyer: expected.buyer,
      supplier: expected.supplier,
      shipmentId: expected.shipmentId,
      assetDescription: "2,400 vaccine packs in monitored cold-chain containers"
    }
  },
  {
    id: "doc-delivery-clean",
    type: "delivery_note",
    title: "Signed delivery note",
    issuedAt: "2026-06-22T18:40:00.000Z",
    fingerprint: "fp-delivery-4421",
    claims: {
      shipmentId: expected.shipmentId,
      deliveredAt: "2026-06-22T18:33:00.000Z",
      deliveryLocation: "Istanbul BioPharma Receiving Dock 3",
      signedBy: "M. Kaya"
    }
  },
  {
    id: "doc-temp-clean",
    type: "temperature_log",
    title: "Cold-chain sensor summary",
    issuedAt: "2026-06-22T18:36:00.000Z",
    fingerprint: "fp-temp-2-7",
    claims: {
      shipmentId: expected.shipmentId,
      temperatureMinC: 2.4,
      temperatureMaxC: 6.8
    }
  },
  {
    id: "doc-vendor-clean",
    type: "vendor_registry",
    title: "Verified supplier registry snapshot",
    issuedAt: "2026-06-20T08:00:00.000Z",
    fingerprint: "fp-vendor-aster",
    claims: {
      supplier: expected.supplier
    }
  }
];

export const seededEvidenceBundles: Record<SeededScenario, EvidenceBundle> = {
  clean: {
    id: "bundle-clean-acceptance",
    dealId: "deal-vaccine-lane-042",
    milestoneId: "ms-delivery-acceptance",
    scenario: "clean",
    submittedBy: expected.supplier,
    submittedAt: "2026-06-23T08:00:00.000Z",
    summary: "All milestone evidence agrees and temperature stayed inside the required cold-chain band.",
    expected,
    documents: cleanDocuments
  },
  amountMismatch: {
    id: "bundle-amount-mismatch",
    dealId: "deal-vaccine-lane-042",
    milestoneId: "ms-delivery-acceptance",
    scenario: "amountMismatch",
    submittedBy: expected.supplier,
    submittedAt: "2026-06-23T08:05:00.000Z",
    summary: "Delivery evidence is valid, but the invoice amount exceeds the escrowed milestone.",
    expected,
    documents: cleanDocuments.map((document) =>
      document.type === "invoice"
        ? {
            ...document,
            id: "doc-invoice-mismatch",
            fingerprint: "fp-invoice-8842-amount-mismatch",
            claims: {
              ...document.claims,
              amount: 48750
            }
          }
        : document
    )
  },
  duplicateInvoice: {
    id: "bundle-duplicate-invoice",
    dealId: "deal-vaccine-lane-042",
    milestoneId: "ms-delivery-acceptance",
    scenario: "duplicateInvoice",
    submittedBy: expected.supplier,
    submittedAt: "2026-06-23T08:10:00.000Z",
    summary: "The submitted invoice fingerprint matches a previously settled invoice.",
    expected,
    documents: cleanDocuments.map((document) =>
      document.type === "invoice"
        ? {
            ...document,
            id: "doc-invoice-duplicate",
            fingerprint: "fp-invoice-8842-prior-settlement",
            claims: {
              ...document.claims,
              duplicateOf: "settled-attestation-2026-06-18-001"
            }
          }
        : document
    )
  }
};
