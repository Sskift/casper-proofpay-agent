import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import type { EvidenceBundle } from "./types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function normalizeEvidenceBundle(bundle: EvidenceBundle): string {
  return stableStringify({
    dealId: bundle.dealId,
    milestoneId: bundle.milestoneId,
    scenario: bundle.scenario,
    submittedAt: bundle.submittedAt,
    expected: bundle.expected,
    documents: bundle.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fingerprint: document.fingerprint,
      claims: document.claims
    }))
  });
}

export function createEvidenceHash(bundle: EvidenceBundle): `0x${string}` {
  const bytes = new TextEncoder().encode(normalizeEvidenceBundle(bundle));
  return `0x${bytesToHex(sha256(bytes))}`;
}
