"use client";

import {
  assessEvidence,
  createEvidenceHash,
  createOperationsDashboard,
  seededDeals,
  seededEvidenceBundles,
  type AgentAssessment,
  type OperationsDashboardModel
} from "@proofpay/agent";
import {
  createAttestationPayload,
  createCasperDeployPlan,
  submitDemoAttestation,
  type CasperAttestationPayload,
  type CasperDeployPlan,
  type DemoCasperTransaction
} from "@proofpay/casper";
import { Card, Chip, Link, Table, Tabs } from "@heroui/react";
import {
  Activity,
  Banknote,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GitBranch,
  RadioTower,
  ScrollText,
  ShieldCheck,
  Thermometer,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CashflowChart,
  EvidenceCoverageChart,
  RiskTapeChart,
  TemperatureChart
} from "@/components/DashboardCharts";

type ScenarioKey = keyof typeof seededEvidenceBundles;
type ChipColor = "success" | "warning" | "danger" | "default" | "accent";

const scenarioCopy: Record<ScenarioKey, { label: string; short: string; operator: string }> = {
  clean: {
    label: "Clean release",
    short: "Invoice, delivery, registry, and cold-chain evidence align.",
    operator: "release candidate"
  },
  amountMismatch: {
    label: "Hold for finance",
    short: "Shipment evidence is credible, but invoice amount exceeds the milestone.",
    operator: "finance review"
  },
  duplicateInvoice: {
    label: "Reject duplicate",
    short: "Invoice fingerprint matches a previously settled attestation.",
    operator: "fraud block"
  }
};

function chipColor(value: string): ChipColor {
  const normalized = value.toLowerCase();
  if (["approve", "ready", "matched", "positive", "complete", "success"].includes(normalized)) return "success";
  if (["hold", "watch", "warning", "manual", "active", "pending"].includes(normalized)) return "warning";
  if (["reject", "blocked", "failed", "negative"].includes(normalized)) return "danger";
  return "default";
}

function decisionLabel(decision: AgentAssessment["decision"]) {
  if (decision === "approve") return "Ready to release";
  if (decision === "hold") return "Human review";
  return "Blocked";
}

function shortHash(value: string, left = 10, right = 8) {
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function MetricCard({ metric }: { metric: OperationsDashboardModel["cockpitMetrics"][number] }) {
  return (
    <div className="metric">
      <div className="metric-label">{metric.label}</div>
      <div className={`metric-value ${metric.tone}`}>{metric.value}</div>
      <div className="metric-sub">{metric.sub}</div>
    </div>
  );
}

function ShellCard({
  id,
  title,
  sub,
  action,
  children,
  className = ""
}: {
  id?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`section ${className}`}>
      <Card className="card" variant="default">
        <Card.Header className="card-header">
          <div>
            <h2 className="card-title">{title}</h2>
            {sub ? <p className="card-sub">{sub}</p> : null}
          </div>
          {action}
        </Card.Header>
        <Card.Content>{children}</Card.Content>
      </Card>
    </section>
  );
}

function DataTable({
  label,
  columns,
  rows
}: {
  label: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <Table className="data-table" variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={label}>
            <Table.Header>
              {columns.map((column, index) => (
                <Table.Column key={column} isRowHeader={index === 0}>{column}</Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {rows.map((row, rowIndex) => (
                <Table.Row key={`${label}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <Table.Cell key={`${label}-${rowIndex}-${cellIndex}`}>{cell}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

function ScenarioSwitch({
  scenario,
  setScenario
}: {
  scenario: ScenarioKey;
  setScenario: (scenario: ScenarioKey) => void;
}) {
  return (
    <div className="scenario-switch" aria-label="Judge mode scenarios">
      {Object.entries(scenarioCopy).map(([key, copy]) => (
        <button
          className={scenario === key ? "scenario-card is-active" : "scenario-card"}
          key={key}
          onClick={() => setScenario(key as ScenarioKey)}
          type="button"
        >
          <span>{copy.operator}</span>
          <strong>{copy.label}</strong>
          <em>{copy.short}</em>
        </button>
      ))}
    </div>
  );
}

function CockpitSection({
  assessment,
  model,
  deployPlan,
  payload,
  transaction
}: {
  assessment: AgentAssessment;
  model: OperationsDashboardModel;
  deployPlan: CasperDeployPlan;
  payload: CasperAttestationPayload;
  transaction: DemoCasperTransaction | null;
}) {
  const deployment = deployPlan.deployment;
  return (
    <section id="cockpit" className="section cockpit-grid">
      <Card className="card cockpit-main" variant="default">
        <Card.Header className="card-header">
          <div>
            <h2 className="card-title">Can ProofPay release now?</h2>
            <p className="card-sub">One-screen readiness: evidence, AI decision, payout state, and Casper anchor.</p>
          </div>
          <Chip color={chipColor(assessment.decision)} variant="soft">{decisionLabel(assessment.decision)}</Chip>
        </Card.Header>
        <Card.Content>
          <div className="cockpit-kpis">
            {model.cockpitMetrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="status-strip">
            <div>
              <ShieldCheck aria-hidden="true" size={16} />
              <span>Policy</span>
              <strong>{assessment.policyVersion}</strong>
            </div>
            <div>
              <ClipboardCheck aria-hidden="true" size={16} />
              <span>Evidence hash</span>
              <code>{shortHash(payload.evidenceHash)}</code>
            </div>
            <div>
              <GitBranch aria-hidden="true" size={16} />
              <span>Decision hash</span>
              <code>{shortHash(payload.decisionHash)}</code>
            </div>
            <div>
              <RadioTower aria-hidden="true" size={16} />
              <span>Testnet</span>
              <strong>{deployment ? `block ${deployment.blockHeight}` : "scenario pending"}</strong>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="card" variant="default">
        <Card.Header className="card-header">
          <div>
            <h2 className="card-title">Action queue</h2>
            <p className="card-sub">Human-readable next steps for the buyer, supplier, and reviewer.</p>
          </div>
          <Activity aria-hidden="true" size={20} />
        </Card.Header>
        <Card.Content>
          <div className="action-list">
            {model.actionQueue.map((item) => (
              <div className={`action-item action-item--${item.status}`} key={item.id}>
                <span className="action-line" />
                <div>
                  <div className="action-title">{item.title}</div>
                  <div className="action-detail">{item.detail}</div>
                </div>
                <Chip color={chipColor(item.status)} variant="soft">{item.status}</Chip>
              </div>
            ))}
          </div>
          <div className="hash-pair">
            <span>Local demo tx</span>
            <code>{transaction?.hash ?? "creating..."}</code>
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function ChartsSection({ model }: { model: OperationsDashboardModel }) {
  return (
    <ShellCard
      id="charts"
      title="Risk, cash, and evidence charts"
      sub="Charts mirror money-run's dense operating style, but tuned for RWA escrow evidence."
      action={<Chip color="accent" variant="soft">Recharts + Lightweight Charts</Chip>}
    >
      <div className="viz-grid">
        <RiskTapeChart model={model} />
        <TemperatureChart model={model} />
        <CashflowChart model={model} />
        <EvidenceCoverageChart model={model} />
      </div>
    </ShellCard>
  );
}

function EvidenceSection({
  assessment,
  model
}: {
  assessment: AgentAssessment;
  model: OperationsDashboardModel;
}) {
  const claimRows = assessment.extractedClaims.map((claim) => [
    claim.label,
    <span className={`mono ${claim.status}`}>{claim.value}</span>,
    claim.source,
    <Chip color={chipColor(claim.status)} variant="soft">{claim.status}</Chip>
  ]);
  const documentRows = model.evidenceMatrix.map((row) => [
    <span className="doc-cell"><FileText aria-hidden="true" size={15} />{row.title}</span>,
    row.coverage,
    <code>{row.fingerprint}</code>,
    row.keyClaim,
    <Chip color={chipColor(row.status)} variant="soft">{row.status}</Chip>
  ]);

  return (
    <ShellCard
      id="evidence"
      title="Evidence room"
      sub="Drill down into documents, normalized claims, and exception handling."
      action={<Bot aria-hidden="true" size={20} />}
    >
      <Tabs defaultSelectedKey="documents" variant="primary">
        <Tabs.List aria-label="Evidence drilldown">
          <Tabs.Tab id="documents">Documents</Tabs.Tab>
          <Tabs.Tab id="claims">Claims</Tabs.Tab>
          <Tabs.Tab id="timeline">Timeline</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="documents">
          <DataTable label="evidence documents" columns={["document", "coverage", "fingerprint", "key claim", "status"]} rows={documentRows} />
        </Tabs.Panel>
        <Tabs.Panel id="claims">
          <DataTable label="extracted claims" columns={["claim", "value", "source", "status"]} rows={claimRows} />
        </Tabs.Panel>
        <Tabs.Panel id="timeline">
          <div className="timeline-list">
            {model.timeline.map((event) => (
              <div className={`timeline-item ${event.status}`} key={event.id}>
                <span />
                <div>
                  <strong>{event.label}</strong>
                  <p>{event.detail}</p>
                  <code>{event.timestamp}</code>
                </div>
                <Chip color={chipColor(event.status)} variant="soft">{event.status}</Chip>
              </div>
            ))}
          </div>
        </Tabs.Panel>
      </Tabs>
    </ShellCard>
  );
}

function CasperSection({
  deployPlan,
  payload
}: {
  deployPlan: CasperDeployPlan;
  payload: CasperAttestationPayload;
}) {
  const deployment = deployPlan.deployment;
  const readinessRows = deployPlan.readiness.map((item) => [
    item.label,
    <Chip color={chipColor(item.status)} variant="soft">{item.status}</Chip>,
    item.detail
  ]);
  const proofRows = [
    ["network", deployPlan.network],
    ["milestone", payload.milestoneId],
    ["testnet tx", deployment?.transactionHash ?? "not recorded for this scenario"],
    ["named key", deployment?.namedKey ?? "pending scenario deploy"],
    ["stored URef", deployment?.uref ?? "pending scenario deploy"],
    ["block", deployment ? `${deployment.blockHeight} / ${deployment.blockHash}` : "pending scenario deploy"],
    ["public key", deployPlan.publicKeyHex]
  ].map(([label, value]) => [label, <code>{value}</code>]);

  return (
    <ShellCard
      id="casper"
      title="Casper attestation"
      sub={deployment ? "Clean scenario is anchored on Casper Testnet." : "This scenario can be reproduced with the command below."}
      action={<Chip color={deployment ? "success" : "warning"} variant="soft">{deployment ? "on-chain" : "manual deploy"}</Chip>}
    >
      <div className="casper-grid">
        <div>
          <div className={deployment ? "proof-banner success" : "proof-banner warning"}>
            {deployment ? <CheckCircle2 aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}
            <p>
              {deployment
                ? "Casper Testnet transaction executed with error_message null and stored attestation URef."
                : "Local demo transaction exists; deploy this scenario to add a matching Testnet attestation."}
            </p>
          </div>
          <DataTable label="casper proof" columns={["field", "value"]} rows={proofRows} />
        </div>
        <div className="command-panel">
          <h3>Deploy command</h3>
          <pre><code>{deployPlan.cliCommand}</code></pre>
          <div className="session-args">
            {deployPlan.sessionArgs.map((arg) => (
              <code key={arg}>{arg}</code>
            ))}
          </div>
        </div>
      </div>
      <div className="readiness-table">
        <DataTable label="submission readiness" columns={["gate", "status", "detail"]} rows={readinessRows} />
      </div>
    </ShellCard>
  );
}

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioKey>("clean");
  const [transaction, setTransaction] = useState<DemoCasperTransaction | null>(null);
  const deal = seededDeals[0];
  const milestone = deal.milestones[0];
  const bundle = seededEvidenceBundles[scenario];

  const assessment = useMemo(() => assessEvidence(bundle), [bundle]);
  const evidenceHash = useMemo(() => createEvidenceHash(bundle), [bundle]);
  const payload = useMemo(
    () =>
      createAttestationPayload({
        milestone,
        evidenceHash,
        assessment
      }),
    [assessment, evidenceHash, milestone]
  );
  const deployPlan = useMemo(
    () =>
      createCasperDeployPlan({
        payload,
        scenario
      }),
    [payload, scenario]
  );
  const model = useMemo(
    () =>
      createOperationsDashboard({
        deal,
        milestone,
        bundle,
        assessment,
        evidenceHash
      }),
    [assessment, bundle, deal, evidenceHash, milestone]
  );

  useEffect(() => {
    let cancelled = false;
    setTransaction(null);

    submitDemoAttestation(payload).then((nextTransaction) => {
      if (!cancelled) {
        setTransaction(nextTransaction);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <span className="brand-dot" />
            <strong>ProofPay Agent</strong>
          </div>
          <nav className="side-nav" aria-label="Dashboard sections">
            <a href="#cockpit">Cockpit</a>
            <a href="#charts">Charts</a>
            <a href="#evidence">Evidence</a>
            <a href="#casper">Casper</a>
          </nav>
          <div className="side-status">
            <span>Buildathon gate</span>
            <strong>Testnet transaction ready</strong>
            <code>{deployPlan.deployment ? shortHash(deployPlan.deployment.transactionHash) : "scenario pending"}</code>
          </div>
        </div>
      </aside>

      <div className="surface">
        <div className="wrap">
          <header className="topbar">
            <div>
              <p className="eyebrow">Casper Agentic Buildathon · Casper Innovation Track</p>
              <h1>RWA Payment Operations Cockpit</h1>
              <p className="sub topbar-meta">
                <span>{deal.name}</span>
                <span>{deal.jurisdiction}</span>
                <span>{milestone.currency} {milestone.amount.toLocaleString("en-US")} milestone</span>
              </p>
            </div>
            <div className="topbar-actions">
              <Link className="button-link secondary" href="https://github.com/Sskift/casper-proofpay-agent" target="_blank">
                <ExternalLink aria-hidden="true" size={15} />
                Repo
              </Link>
              <Link className="button-link primary" href="https://github.com/Sskift/casper-proofpay-agent/blob/main/docs/casper-testnet.md" target="_blank">
                <ScrollText aria-hidden="true" size={15} />
                Testnet evidence
              </Link>
            </div>
          </header>

          <ScenarioSwitch scenario={scenario} setScenario={setScenario} />

          <section className="deal-strip" aria-label="Deal summary">
            <div>
              <Banknote aria-hidden="true" size={18} />
              <span>Escrow</span>
              <strong>{deal.currency} {deal.escrowAmount.toLocaleString("en-US")}</strong>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" size={18} />
              <span>Buyer</span>
              <strong>{deal.buyer}</strong>
            </div>
            <div>
              <FileText aria-hidden="true" size={18} />
              <span>Supplier</span>
              <strong>{deal.supplier}</strong>
            </div>
            <div>
              <Thermometer aria-hidden="true" size={18} />
              <span>Asset</span>
              <strong>{deal.assetType}</strong>
            </div>
          </section>

          <CockpitSection
            assessment={assessment}
            deployPlan={deployPlan}
            model={model}
            payload={payload}
            transaction={transaction}
          />
          <ChartsSection model={model} />
          <EvidenceSection assessment={assessment} model={model} />
          <CasperSection deployPlan={deployPlan} payload={payload} />
        </div>
      </div>
    </main>
  );
}
