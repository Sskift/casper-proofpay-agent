"use client";

import {
  assessEvidence,
  createAuditDossier,
  createEvidenceHash,
  createOperationsDashboard,
  seededDeals,
  seededEvidenceBundles,
  type AgentAssessment,
  type AuditDossier,
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
  CopyCheck,
  ExternalLink,
  FileText,
  GitBranch,
  PackageCheck,
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
type SectionId = "cockpit" | "charts" | "evidence" | "casper" | "dossier";
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

const dashboardSections: Array<{ id: SectionId; label: string; eyebrow: string; detail: string }> = [
  {
    id: "cockpit",
    label: "Cockpit",
    eyebrow: "01",
    detail: "Release decision"
  },
  {
    id: "charts",
    label: "Charts",
    eyebrow: "02",
    detail: "Risk and cash"
  },
  {
    id: "evidence",
    label: "Evidence",
    eyebrow: "03",
    detail: "Claims and documents"
  },
  {
    id: "casper",
    label: "Casper",
    eyebrow: "04",
    detail: "Testnet proof"
  },
  {
    id: "dossier",
    label: "Dossier",
    eyebrow: "05",
    detail: "Audit package"
  }
];

const dashboardSectionIds = dashboardSections.map((section) => section.id);

function chipColor(value: string): ChipColor {
  const normalized = value.toLowerCase();
  if (["approve", "ready", "matched", "positive", "complete", "success", "passed"].includes(normalized)) return "success";
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

function useScrollSpy(sectionIds: SectionId[], offset = 118) {
  const [activeSection, setActiveSection] = useState<SectionId>(sectionIds[0]);

  useEffect(() => {
    const updateActiveSection = () => {
      const sectionMetrics = sectionIds
        .map((id) => {
          const element = document.getElementById(id);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            id,
            top: rect.top,
            distance: Math.abs(rect.top - offset)
          };
        })
        .filter((metric): metric is { id: SectionId; top: number; distance: number } => Boolean(metric));

      if (sectionMetrics.length === 0) return;

      const passedSection = [...sectionMetrics]
        .filter((metric) => metric.top <= offset)
        .sort((a, b) => b.top - a.top)[0];
      const closestSection = [...sectionMetrics].sort((a, b) => a.distance - b.distance)[0];
      const nextSection = passedSection?.id ?? closestSection.id;

      setActiveSection((current) => (current === nextSection ? current : nextSection));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [offset, sectionIds]);

  return activeSection;
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

function SectionHeading({
  step,
  eyebrow,
  title,
  sub,
  action
}: {
  step: string;
  eyebrow: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-marker">{step}</div>
      <div className="section-copy">
        <span className="section-kicker">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
        {sub ? <p className="section-sub">{sub}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

function ShellCard({
  id,
  step,
  eyebrow,
  title,
  sub,
  action,
  children,
  className = ""
}: {
  id?: string;
  step: string;
  eyebrow: string;
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`section section-frame ${className}`}>
      <SectionHeading action={action} eyebrow={eyebrow} step={step} sub={sub} title={title} />
      <Card className="card section-card" variant="default">
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
    <section id="cockpit" className="section section-frame cockpit-section">
      <SectionHeading
        action={<Chip color={chipColor(assessment.decision)} variant="soft">{decisionLabel(assessment.decision)}</Chip>}
        eyebrow="Decision command"
        step="01"
        sub="Evidence score, AI decision, payout state, and Casper anchor in one operator surface."
        title="Can ProofPay release now?"
      />
      <div className="cockpit-grid">
        <Card className="card cockpit-main" variant="default">
          <Card.Header className="card-header">
            <div>
              <h3 className="card-title">Release readiness</h3>
              <p className="card-sub">The metrics a reviewer needs before signing a milestone payment.</p>
            </div>
            <ShieldCheck aria-hidden="true" size={20} />
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
              <h3 className="card-title">Action queue</h3>
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
      </div>
    </section>
  );
}

function ChartsSection({ model }: { model: OperationsDashboardModel }) {
  return (
    <ShellCard
      id="charts"
      eyebrow="Signal room"
      step="02"
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
  const matchedDocuments = model.evidenceMatrix.filter((row) => row.status === "matched");
  const exceptionDocuments = model.evidenceMatrix.filter((row) => row.status !== "matched");
  const followUpItems = assessment.requiredFollowUp.length
    ? assessment.requiredFollowUp
    : ["No manual follow-up required for this scenario."];

  return (
    <ShellCard
      id="evidence"
      eyebrow="Evidence review"
      step="03"
      title="Evidence room"
      sub="A reviewer-first workspace for documents, normalized claims, and exception handling."
      action={<Bot aria-hidden="true" size={20} />}
    >
      <div className="evidence-workbench">
        <aside className="review-rail" aria-label="Evidence review summary">
          <div className={`verdict-card verdict-card--${assessment.decision}`}>
            <span>Agent verdict</span>
            <strong>{decisionLabel(assessment.decision)}</strong>
            <p>{assessment.confidence}% confidence · risk score {assessment.riskScore}/100</p>
          </div>
          <div className="review-stat-grid">
            <div>
              <span>Documents cleared</span>
              <strong>{matchedDocuments.length}/{model.evidenceMatrix.length}</strong>
            </div>
            <div>
              <span>Exceptions</span>
              <strong>{exceptionDocuments.length}</strong>
            </div>
            <div>
              <span>Policy</span>
              <strong>{assessment.policyVersion}</strong>
            </div>
            <div>
              <span>Flags</span>
              <strong>{assessment.flags.length || "none"}</strong>
            </div>
          </div>
          <div className="followup-card">
            <div className="mini-title">Operator follow-up</div>
            {followUpItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div className="reason-stack">
            {assessment.reasons.map((reason) => (
              <div className="reason-pill" key={reason}>
                <CheckCircle2 aria-hidden="true" size={14} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="evidence-drilldown">
          <Tabs defaultSelectedKey="documents" variant="primary">
            <Tabs.List aria-label="Evidence drilldown">
              <Tabs.Tab id="documents">Documents</Tabs.Tab>
              <Tabs.Tab id="claims">Claims</Tabs.Tab>
              <Tabs.Tab id="timeline">Timeline</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="documents">
              <div className="document-grid">
                {model.evidenceMatrix.map((row) => (
                  <article className={`document-card document-card--${row.status}`} key={row.id}>
                    <div className="document-card__head">
                      <FileText aria-hidden="true" size={17} />
                      <div>
                        <span>{row.documentType.replaceAll("_", " ")}</span>
                        <strong>{row.title}</strong>
                      </div>
                      <Chip color={chipColor(row.status)} variant="soft">{row.status}</Chip>
                    </div>
                    <p>{row.keyClaim}</p>
                    <div className="document-card__meta">
                      <span>{row.coverage}</span>
                      <code title={row.fingerprint}>{shortHash(row.fingerprint, 12, 8)}</code>
                    </div>
                  </article>
                ))}
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="claims">
              <div className="claim-grid">
                {assessment.extractedClaims.map((claim) => (
                  <article className={`claim-card claim-card--${claim.status}`} key={`${claim.label}-${claim.source}`}>
                    <div>
                      <span>{claim.label}</span>
                      <strong className="mono">{claim.value}</strong>
                    </div>
                    <p>{claim.source}</p>
                    <Chip color={chipColor(claim.status)} variant="soft">{claim.status}</Chip>
                  </article>
                ))}
              </div>
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
        </div>
      </div>
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
  const proofFacts = [
    { label: "Network", value: deployPlan.network, display: deployPlan.network },
    { label: "Milestone", value: payload.milestoneId, display: payload.milestoneId },
    {
      label: "Testnet tx",
      value: deployment?.transactionHash ?? "not recorded for this scenario",
      display: deployment ? shortHash(deployment.transactionHash, 14, 10) : "pending deploy"
    },
    {
      label: "Named key",
      value: deployment?.namedKey ?? "pending scenario deploy",
      display: deployment?.namedKey ?? "pending deploy"
    },
    {
      label: "Stored URef",
      value: deployment?.uref ?? "pending scenario deploy",
      display: deployment ? shortHash(deployment.uref, 18, 12) : "pending deploy"
    },
    {
      label: "Block",
      value: deployment ? `${deployment.blockHeight} / ${deployment.blockHash}` : "pending scenario deploy",
      display: deployment ? String(deployment.blockHeight) : "pending deploy"
    },
    {
      label: "Public key",
      value: deployPlan.publicKeyHex,
      display: shortHash(deployPlan.publicKeyHex, 14, 10)
    }
  ];

  return (
    <ShellCard
      id="casper"
      eyebrow="On-chain proof"
      step="04"
      title="Casper attestation"
      sub={deployment ? "Clean scenario is anchored on Casper Testnet." : "This scenario can be reproduced with the command below."}
      action={<Chip color={deployment ? "success" : "warning"} variant="soft">{deployment ? "on-chain" : "manual deploy"}</Chip>}
    >
      <div className="proof-workbench">
        <div className="proof-main">
          <div className={deployment ? "proof-banner success" : "proof-banner warning"}>
            {deployment ? <CheckCircle2 aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}
            <p>
              {deployment
                ? "Casper Testnet transaction executed with error_message null and stored attestation URef."
                : "Local demo transaction exists; deploy this scenario to add a matching Testnet attestation."}
            </p>
          </div>
          <div className="proof-summary-grid">
            {proofFacts.map((fact) => (
              <div className="proof-stat-card" key={fact.label}>
                <span>{fact.label}</span>
                <code title={fact.value}>{fact.display}</code>
              </div>
            ))}
          </div>
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
      <div className="readiness-grid" aria-label="Submission readiness">
        {deployPlan.readiness.map((item) => (
          <article className={`readiness-card readiness-card--${item.status}`} key={item.id}>
            <div>
              <span>{item.id.replaceAll("-", " ")}</span>
              <strong>{item.label}</strong>
            </div>
            <Chip color={chipColor(item.status)} variant="soft">{item.status}</Chip>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </ShellCard>
  );
}

function DossierSection({ dossier }: { dossier: AuditDossier }) {
  const verificationFacts = [
    { label: "Evidence hash", value: dossier.verification.evidenceHash },
    { label: "Decision hash", value: dossier.verification.decisionHash },
    { label: "Local tx", value: dossier.verification.localTransactionHash ?? "pending local transaction" },
    { label: "Network", value: dossier.verification.network },
    { label: "Casper tx", value: dossier.verification.casperTransactionHash ?? "pending scenario deploy" },
    { label: "Stored URef", value: dossier.verification.storedURef ?? "pending scenario deploy" }
  ];
  const dossierJson = JSON.stringify(dossier, null, 2);

  return (
    <ShellCard
      id="dossier"
      eyebrow="Judge package"
      step="05"
      title="Audit dossier"
      sub="One portable package for the decision trace, hashes, Casper proof facts, and reproduction checklist."
      action={<PackageCheck aria-hidden="true" size={20} />}
    >
      <div className="dossier-grid">
        <div className="dossier-main">
          <div className={`dossier-summary dossier-summary--${dossier.decision}`}>
            <div>
              <span>Dossier</span>
              <strong>{dossier.id}</strong>
              <p>{dossier.policyVersion}</p>
            </div>
            <div>
              <span>Decision</span>
              <strong>{decisionLabel(dossier.decision)}</strong>
              <p>{dossier.confidence}% confidence · risk {dossier.riskScore}/100</p>
            </div>
            <div>
              <span>Release amount</span>
              <strong>{dossier.releaseAmount}</strong>
              <p>{dossier.scenario}</p>
            </div>
          </div>

          <div className="trace-grid" aria-label="Audit reasoning trace">
            {dossier.trace.map((step) => (
              <article className={`trace-card trace-card--${step.status}`} key={step.id}>
                <div className="trace-card__head">
                  <div>
                    <span>{step.id.replaceAll("-", " ")}</span>
                    <strong>{step.label}</strong>
                  </div>
                  <Chip color={chipColor(step.status)} variant="soft">{step.status}</Chip>
                </div>
                <dl>
                  <div>
                    <dt>Expected</dt>
                    <dd>{step.expected}</dd>
                  </div>
                  <div>
                    <dt>Observed</dt>
                    <dd>{step.observed}</dd>
                  </div>
                </dl>
                <p>{step.impact}</p>
                <div className="trace-sources">
                  {step.sources.map((source) => (
                    <code key={`${step.id}-${source}`}>{source}</code>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="dossier-side" aria-label="Portable audit package">
          <div className="verification-panel">
            <div className="mini-title">Verification chain</div>
            {verificationFacts.map((fact) => (
              <div className="verification-row" key={fact.label}>
                <span>{fact.label}</span>
                <code title={fact.value}>{fact.value}</code>
              </div>
            ))}
          </div>

          <div className="checklist-panel">
            <div className="mini-title">Reviewer checklist</div>
            <ol>
              {dossier.reviewChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="dossier-json">
            <div className="json-head">
              <div>
                <span>Portable JSON</span>
                <strong>Copy-ready audit package</strong>
              </div>
              <CopyCheck aria-hidden="true" size={18} />
            </div>
            <pre><code>{dossierJson}</code></pre>
          </div>
        </aside>
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
  const dossier = useMemo(
    () =>
      createAuditDossier({
        deal,
        milestone,
        bundle,
        assessment,
        evidenceHash,
        decisionHash: payload.decisionHash,
        casper: {
          network: deployPlan.network,
          transactionHash: deployPlan.deployment?.transactionHash,
          blockHeight: deployPlan.deployment?.blockHeight,
          namedKey: deployPlan.deployment?.namedKey,
          storedURef: deployPlan.deployment?.uref
        },
        localTransactionHash: transaction?.hash,
        cliCommand: deployPlan.cliCommand
      }),
    [assessment, bundle, deal, deployPlan, evidenceHash, milestone, payload.decisionHash, transaction]
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
  const activeSection = useScrollSpy(dashboardSectionIds);

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
            {dashboardSections.map((section) => (
              <a
                aria-current={activeSection === section.id ? "page" : undefined}
                className={activeSection === section.id ? "is-active" : undefined}
                href={`#${section.id}`}
                key={section.id}
              >
                <span>{section.eyebrow}</span>
                <strong>{section.label}</strong>
                <em>{section.detail}</em>
              </a>
            ))}
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
          <DossierSection dossier={dossier} />
        </div>
      </div>
    </main>
  );
}
