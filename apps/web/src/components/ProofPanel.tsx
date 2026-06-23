import type { CasperAttestationPayload, DemoCasperTransaction } from "@proofpay/casper";
import { ExternalLink, GitBranch, RadioTower, ScrollText, TriangleAlert } from "lucide-react";

interface ProofPanelProps {
  payload: CasperAttestationPayload;
  transaction: DemoCasperTransaction | null;
}

export function ProofPanel({ payload, transaction }: ProofPanelProps) {
  return (
    <section className="panel proof-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Casper proof</p>
          <h2>Attestation payload</h2>
        </div>
        <RadioTower aria-hidden="true" size={22} />
      </div>

      <div className="eligibility-warning">
        <TriangleAlert aria-hidden="true" size={18} />
        <p>Local demo transaction shown. DoraHacks eligibility still requires Casper Testnet deployment and a transaction-producing on-chain component.</p>
      </div>

      <dl className="proof-list">
        <div>
          <dt><GitBranch aria-hidden="true" size={14} /> Network</dt>
          <dd>{transaction?.network ?? "pending"}</dd>
        </div>
        <div>
          <dt><ScrollText aria-hidden="true" size={14} /> Demo tx hash</dt>
          <dd><code>{transaction?.hash ?? "creating..."}</code></dd>
        </div>
        <div>
          <dt>Decision hash</dt>
          <dd><code>{payload.decisionHash}</code></dd>
        </div>
        <div>
          <dt>Milestone</dt>
          <dd>{payload.milestoneId}</dd>
        </div>
        <div>
          <dt>Contract package</dt>
          <dd><code>pending Casper Testnet deploy</code></dd>
        </div>
      </dl>

      <a
        className="doc-link"
        href="https://github.com/Sskift/casper-proofpay-agent/blob/main/docs/casper-testnet.md"
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink aria-hidden="true" size={15} />
        Testnet deployment instructions live in repository docs
      </a>
    </section>
  );
}
