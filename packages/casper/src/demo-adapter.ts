import type { CasperAttestationPayload, DemoCasperTransaction } from "./types";
import { hashObject } from "./hash";

export async function submitDemoAttestation(payload: CasperAttestationPayload): Promise<DemoCasperTransaction> {
  return {
    hash: hashObject({
      network: "casper-testnet-demo",
      payload
    }),
    network: "casper-testnet-demo",
    status: "accepted",
    submittedAt: payload.assessedAt,
    explorerUrl: null,
    payload
  };
}
