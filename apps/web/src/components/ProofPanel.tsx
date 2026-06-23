import type { CasperAttestationPayload, CasperDeployPlan, DemoCasperTransaction } from "@proofpay/casper";
import {
  CircleCheck,
  CircleDashed,
  ExternalLink,
  GitBranch,
  RadioTower,
  ScrollText,
  Terminal,
  TriangleAlert
} from "lucide-react";

interface ProofPanelProps {
  deployPlan: CasperDeployPlan;
  payload: CasperAttestationPayload;
  transaction: DemoCasperTransaction | null;
}

function statusIcon(status: CasperDeployPlan["readiness"][number]["status"]) {
  if (status === "ready") {
    return <CircleCheck aria-hidden="true" size={15} />;
  }

  if (status === "blocked") {
    return <TriangleAlert aria-hidden="true" size={15} />;
  }

  return <CircleDashed aria-hidden="true" size={15} />;
}

export function ProofPanel({ deployPlan, payload, transaction }: ProofPanelProps) {
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

      <div className="readiness-list" aria-label="Submission readiness">
        {deployPlan.readiness.map((item) => (
          <div className={`readiness-item ${item.status}`} key={item.id}>
            {statusIcon(item.status)}
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <dl className="proof-list">
        <div>
          <dt><GitBranch aria-hidden="true" size={14} /> Network</dt>
          <dd>{deployPlan.network}</dd>
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
        <div>
          <dt>Faucet public key</dt>
          <dd><code>{deployPlan.publicKeyHex}</code></dd>
        </div>
      </dl>

      <div className="command-box">
        <div className="command-title">
          <Terminal aria-hidden="true" size={15} />
          <strong>After faucet funding</strong>
        </div>
        {deployPlan.postFundingCommands.map((command) => (
          <code key={command}>{command}</code>
        ))}
      </div>

      <details className="deploy-details">
        <summary>Casper deploy command</summary>
        <pre><code>{deployPlan.cliCommand}</code></pre>
        <div className="arg-list">
          {deployPlan.sessionArgs.map((arg) => (
            <code key={arg}>{arg}</code>
          ))}
        </div>
      </details>

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
