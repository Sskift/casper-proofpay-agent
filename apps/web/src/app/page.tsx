"use client";

import {
  assessEvidence,
  createAuditDossier,
  createEvidenceHash,
  createOperationsDashboard,
  createProductDepthModel,
  createSettlementRunbook,
  inspectEvidenceIntake,
  parseEvidenceBundle,
  seededDeals,
  seededEvidenceBundles,
  type AgentAssessment,
  type AuditDossier,
  type Deal,
  type EvidenceBundle,
  type EvidenceIntakeReport,
  type Milestone,
  type OperationsDashboardModel,
  type ProductDepthModel,
  type SettlementRunbook,
  type WorkflowRole
} from "@proofpay/agent";
import {
  createAttestationPayload,
  createCasperDeployPlan,
  createCasperProofWorkbench,
  createCasperVerificationSummary,
  submitDemoAttestation,
  verifyCasperAttestation,
  type AttestationVerificationReport,
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
  Database,
  ExternalLink,
  FileJson,
  FileText,
  GitBranch,
  KeyRound,
  Layers3,
  ListChecks,
  RadioTower,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Terminal,
  Thermometer,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CashflowChart,
  EvidenceCoverageChart,
  MiniBarChart,
  MiniRadialGauge,
  RiskTapeChart,
  TemperatureChart
} from "@/components/DashboardCharts";

type ScenarioKey = keyof typeof seededEvidenceBundles;
type SectionId = "cockpit" | "journey" | "trust" | "charts" | "evidence" | "casper" | "dossier";
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

function scenarioLabelFor(scenario: EvidenceBundle["scenario"]) {
  return scenario === "realCase" ? "Real case" : scenarioCopy[scenario].label;
}

const dashboardSections: Array<{ id: SectionId; label: string; eyebrow: string; detail: string }> = [
  {
    id: "cockpit",
    label: "Cockpit",
    eyebrow: "01",
    detail: "Release decision"
  },
  {
    id: "journey",
    label: "Journey",
    eyebrow: "02",
    detail: "Intake and roles"
  },
  {
    id: "trust",
    label: "Trust",
    eyebrow: "03",
    detail: "Real-use chain"
  },
  {
    id: "charts",
    label: "Charts",
    eyebrow: "04",
    detail: "Risk and cash"
  },
  {
    id: "evidence",
    label: "Evidence",
    eyebrow: "05",
    detail: "Claims and documents"
  },
  {
    id: "casper",
    label: "Casper",
    eyebrow: "06",
    detail: "Testnet proof"
  },
  {
    id: "dossier",
    label: "Dossier",
    eyebrow: "07",
    detail: "Audit package"
  }
];

const dashboardSectionIds = dashboardSections.map((section) => section.id);
const repositoryBlobBaseUrl = "https://github.com/Sskift/casper-proofpay-agent/blob/main";

const judgeWalkthroughSteps: Array<{ id: Extract<SectionId, "cockpit" | "trust" | "evidence" | "casper" | "dossier">; label: string; detail: string }> = [
  {
    id: "cockpit",
    label: "Cockpit",
    detail: "See the release decision."
  },
  {
    id: "trust",
    label: "Trust",
    detail: "Follow evidence to settlement actions."
  },
  {
    id: "evidence",
    label: "Evidence",
    detail: "Inspect source claims."
  },
  {
    id: "casper",
    label: "Casper",
    detail: "Verify Testnet attestation."
  },
  {
    id: "dossier",
    label: "Dossier",
    detail: "Export the audit package."
  }
];

const chartColors = {
  blue: "#1664ff",
  green: "#12b76a",
  amber: "#b7791f",
  red: "#f31260",
  gray: "#98a2b3"
};

function chipColor(value: string): ChipColor {
  const normalized = value.toLowerCase();
  if (["approve", "ready", "matched", "positive", "complete", "success", "passed", "recorded", "live", "submitted", "verified", "available", "auto_release_ready"].includes(normalized)) return "success";
  if (["hold", "watch", "warning", "manual", "active", "pending", "standby", "demo", "required", "needs_review", "human_review_required"].includes(normalized)) return "warning";
  if (["reject", "blocked", "failed", "negative", "mismatch", "release_blocked"].includes(normalized)) return "danger";
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

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

type PlaygroundResult =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "invalid_json";
      message: string;
    }
  | {
      status: "invalid_bundle";
      report: EvidenceIntakeReport;
    }
  | {
      status: "assessed";
      bundle: EvidenceBundle;
      report: EvidenceIntakeReport;
      assessment: AgentAssessment;
      evidenceHash: `0x${string}`;
      payload: CasperAttestationPayload;
      dossier: AuditDossier;
      runbook: SettlementRunbook;
      source: "api" | "client";
      message: string;
    };

type ApiRouteStatus =
  | {
      status: "checking";
      message: string;
    }
  | {
      status: "live";
      message: string;
    }
  | {
      status: "static_fallback";
      message: string;
    };

type EvidenceIntakeApiResponse =
  | {
      accepted: true;
      report: EvidenceIntakeReport;
      assessment: AgentAssessment;
      payload: CasperAttestationPayload;
      dossier: AuditDossier;
      settlementRunbook: SettlementRunbook;
    }
  | {
      accepted: false;
      report: EvidenceIntakeReport;
    };

function createPlaygroundContext(bundle: EvidenceBundle): { deal: Deal; milestone: Milestone } {
  const milestone: Milestone = {
    id: bundle.milestoneId,
    dealId: bundle.dealId,
    title: "Release payment after verified RWA delivery",
    description: "Pay the supplier when the evidence bundle matches the milestone terms.",
    amount: bundle.expected.amount,
    currency: bundle.expected.currency,
    dueDate: "external evidence package",
    state: "under_agent_review",
    requiredEvidence: ["invoice", "bill_of_lading", "delivery_note", "temperature_log", "vendor_registry"]
  };

  return {
    milestone,
    deal: {
      id: bundle.dealId,
      name: "External RWA Milestone Escrow",
      buyer: bundle.expected.buyer,
      supplier: bundle.expected.supplier,
      assetType: bundle.documents.find((document) => document.claims.assetDescription)?.claims.assetDescription ?? "Real-world asset shipment",
      jurisdiction: "external evidence package",
      escrowAmount: bundle.expected.amount,
      currency: bundle.expected.currency,
      milestones: [milestone]
    }
  };
}

function assessPlaygroundBundle(bundle: EvidenceBundle, report: EvidenceIntakeReport): Extract<PlaygroundResult, { status: "assessed" }> {
  const { deal, milestone } = createPlaygroundContext(bundle);
  const assessment = assessEvidence(bundle);
  const evidenceHash = createEvidenceHash(bundle);
  const payload = createAttestationPayload({ milestone, evidenceHash, assessment });
  const deployPlan = createCasperDeployPlan({ payload, scenario: bundle.scenario });
  const dossier = createAuditDossier({
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
    cliCommand: deployPlan.cliCommand
  });
  const runbook = createSettlementRunbook({ deal, milestone, bundle, assessment, dossier });

  return {
    status: "assessed",
    bundle,
    report,
    assessment,
    evidenceHash,
    payload,
    dossier,
    runbook,
    source: "client",
    message: "Static/client replay used; dynamic API route was unavailable."
  };
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

function SectionBadge({
  children,
  tone = "accent"
}: {
  children: ReactNode;
  tone?: "accent" | "success" | "warning";
}) {
  return <span className={`section-badge section-badge--${tone}`}>{children}</span>;
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

function JudgeWalkthrough({ activeSection }: { activeSection: SectionId }) {
  const scrollToStep = (id: SectionId) => {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <section className="judge-walkthrough" aria-label="Judge walkthrough">
      <div className="judge-walkthrough__head">
        <span>Judge walkthrough</span>
        <strong>Three-minute review route</strong>
      </div>
      <div className="walkthrough-steps">
        {judgeWalkthroughSteps.map((step, index) => (
          <button
            aria-current={activeSection === step.id ? "step" : undefined}
            className={activeSection === step.id ? "walkthrough-step is-active" : "walkthrough-step"}
            key={step.id}
            onClick={() => scrollToStep(step.id)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
            <em>{step.detail}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function RealCaseRunSection() {
  const realCasePath = "examples/video-integrated-cold-chain-real-case.json";
  const commands = [
    {
      label: "1. Use the video-integrated case",
      detail: "Fresh follow-on cold-chain shipment on the same buyer, supplier, and trade lane used in the demo story.",
      command: realCasePath
    },
    {
      label: "2. Generate a fresh ProofPay payload",
      detail: "The output includes the agent decision, evidence hash, decision hash, and Casper session args.",
      command: `npm run realcase:prepare -- ${realCasePath}`
    },
    {
      label: "3. Inspect the transaction command",
      detail: "This is a dry run. It prints the exact Casper Testnet transaction command without signing.",
      command: `npm run realcase:deploy:print -- ${realCasePath}`
    },
    {
      label: "4. Sign locally with a funded Testnet key",
      detail: "Private keys stay on the operator machine. The server never receives custody keys.",
      command: `CASPER_SECRET_KEY=/absolute/path/to/secret_key.pem npm run realcase:deploy:testnet -- ${realCasePath}`
    },
    {
      label: "5. Verify the public API path",
      detail: "The same evidence JSON can be prepared through the hosted API before local signing.",
      command: `curl -X POST https://casper-proofpay-agent-web.vercel.app/api/real-case/prepare -H 'content-type: application/json' --data @${realCasePath}`
    }
  ];

  return (
    <section className="realcase-run" id="realcase-run" aria-label="Run a new real case on Casper Testnet">
      <div className="realcase-run__head">
        <div>
          <span>Fresh transaction path</span>
          <strong>Run one new real case end to end</strong>
          <p>Use the video story's next cold-chain shipment, let ProofPay compute a new attestation payload, then sign one new Casper Testnet transaction from a local funded key.</p>
        </div>
        <SectionBadge tone="success">new tx ready</SectionBadge>
      </div>
      <div className="realcase-run__grid">
        {commands.map((item) => (
          <article className="realcase-step" key={item.label}>
            <div className="realcase-step__title">
              <Terminal aria-hidden="true" size={16} />
              <strong>{item.label}</strong>
            </div>
            <p>{item.detail}</p>
            <pre><code>{item.command}</code></pre>
          </article>
        ))}
      </div>
    </section>
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
  const matchedDocuments = model.evidenceMatrix.filter((row) => row.status === "matched").length;
  const exceptionDocuments = model.evidenceMatrix.length - matchedDocuments;
  const evidencePercent = Math.round((matchedDocuments / model.evidenceMatrix.length) * 100);
  const riskHealth = Math.max(0, 100 - assessment.riskScore);
  const decisionState = assessment.decision === "approve" ? "ready" : assessment.decision === "hold" ? "watch" : "blocked";
  const chainState = deployment ? "recorded" : "watch";
  const primaryAction = model.actionQueue[0];
  const decisionSteps = [
    {
      id: "policy",
      icon: <ShieldCheck aria-hidden="true" size={17} />,
      label: "Policy gate",
      value: assessment.policyVersion,
      status: decisionState
    },
    {
      id: "evidence",
      icon: <ClipboardCheck aria-hidden="true" size={17} />,
      label: "Evidence",
      value: `${matchedDocuments}/${model.evidenceMatrix.length} cleared`,
      status: exceptionDocuments > 0 ? "watch" : "ready"
    },
    {
      id: "decision",
      icon: <Bot aria-hidden="true" size={17} />,
      label: "Agent decision",
      value: decisionLabel(assessment.decision),
      status: decisionState
    },
    {
      id: "chain",
      icon: <RadioTower aria-hidden="true" size={17} />,
      label: "Casper anchor",
      value: deployment ? `block ${deployment.blockHeight}` : "scenario pending",
      status: chainState
    }
  ];
  const actorHandoff = [
    {
      label: "ProofPay Agent",
      value: `${assessment.confidence}% confidence`,
      detail: `risk ${assessment.riskScore}/100`,
      status: decisionState
    },
    {
      label: "Buyer",
      value: assessment.decision === "approve" ? "sign release" : "review exception",
      detail: primaryAction?.title ?? "review evidence package",
      status: decisionState
    },
    {
      label: "Casper",
      value: deployment ? "attestation recorded" : "deploy when ready",
      detail: deployment ? shortHash(deployment.transactionHash, 12, 8) : "no Testnet hash for this scenario",
      status: chainState
    }
  ];

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

            <div className="cockpit-visuals" aria-label="Decision gauges">
              <MiniRadialGauge
                color={assessment.confidence >= 90 ? chartColors.green : chartColors.amber}
                label="Confidence"
                sub="agent certainty"
                value={assessment.confidence}
              />
              <MiniRadialGauge
                color={riskHealth >= 70 ? chartColors.green : riskHealth >= 35 ? chartColors.amber : chartColors.red}
                label="Risk health"
                sub={`${assessment.riskScore}/100 risk`}
                value={riskHealth}
              />
              <MiniRadialGauge
                color={evidencePercent === 100 ? chartColors.green : chartColors.amber}
                label="Evidence"
                sub={`${matchedDocuments}/${model.evidenceMatrix.length} cleared`}
                value={evidencePercent}
              />
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

        <Card className="card cockpit-command" variant="default">
          <Card.Header className="card-header">
            <div>
              <h3 className="card-title">Decision path</h3>
              <p className="card-sub">Compact path first, operational details one click deeper.</p>
            </div>
            <Activity aria-hidden="true" size={20} />
          </Card.Header>
          <Card.Content>
            <div className="decision-spine" aria-label="Release decision path">
              {decisionSteps.map((step) => (
                <div className={`decision-node decision-node--${step.status}`} key={step.id}>
                  <span className="decision-node__icon">{step.icon}</span>
                  <div>
                    <span>{step.label}</span>
                    <strong>{step.value}</strong>
                  </div>
                  <i aria-hidden="true" />
                </div>
              ))}
            </div>

            <div className="cockpit-tabs">
              <Tabs defaultSelectedKey="actions" variant="primary">
                <Tabs.List aria-label="Cockpit operational detail tabs">
                  <Tabs.Tab id="actions">
                    <ListChecks aria-hidden="true" size={15} />
                    Actions
                  </Tabs.Tab>
                  <Tabs.Tab id="hashes">
                    <GitBranch aria-hidden="true" size={15} />
                    Hashes
                  </Tabs.Tab>
                  <Tabs.Tab id="actors">
                    <Activity aria-hidden="true" size={15} />
                    Actors
                  </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel id="actions">
                  <div className="action-list action-list--compact">
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
                </Tabs.Panel>
                <Tabs.Panel id="hashes">
                  <div className="hash-grid">
                    <div className="hash-pair">
                      <span>Evidence hash</span>
                      <code>{payload.evidenceHash}</code>
                    </div>
                    <div className="hash-pair">
                      <span>Decision hash</span>
                      <code>{payload.decisionHash}</code>
                    </div>
                    <div className="hash-pair">
                      <span>Local demo tx</span>
                      <code>{transaction?.hash ?? "creating..."}</code>
                    </div>
                    <div className="hash-pair">
                      <span>Testnet tx</span>
                      <code>{deployment?.transactionHash ?? "scenario pending"}</code>
                    </div>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id="actors">
                  <div className="actor-handoff">
                    {actorHandoff.map((actor) => (
                      <div className={`actor-card actor-card--${actor.status}`} key={actor.label}>
                        <span>{actor.label}</span>
                        <strong>{actor.value}</strong>
                        <p>{actor.detail}</p>
                      </div>
                    ))}
                  </div>
                </Tabs.Panel>
              </Tabs>
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}

function ChartsSection({ model }: { model: OperationsDashboardModel }) {
  const latestRisk = model.chartSeries.risk.at(-1)?.score ?? 0;
  const temperatureSeries = model.chartSeries.temperature;
  const minTemperature = Math.min(...temperatureSeries.map((point) => point.minC));
  const maxTemperature = Math.max(...temperatureSeries.map((point) => point.maxC));
  const latestCashflow = model.chartSeries.cashflow.at(-1);
  const coverageAverage = Math.round(
    model.chartSeries.evidenceCoverage.reduce((total, item) => total + item.score, 0) / model.chartSeries.evidenceCoverage.length
  );
  const chartSummary = [
    {
      id: "risk",
      label: "Risk",
      value: `${latestRisk}/100`,
      detail: latestRisk < 30 ? "release-grade" : latestRisk < 75 ? "needs review" : "blocked",
      tone: latestRisk < 30 ? "positive" : latestRisk < 75 ? "warning" : "negative"
    },
    {
      id: "cash",
      label: "Cashflow",
      value: `$${Math.round(latestCashflow?.releaseReady ?? 0).toLocaleString("en-US")}`,
      detail: `${Math.round(latestCashflow?.disputed ?? 0).toLocaleString("en-US")} disputed`,
      tone: (latestCashflow?.disputed ?? 0) > 0 ? "warning" : "positive"
    },
    {
      id: "temperature",
      label: "Cold-chain",
      value: `${minTemperature.toFixed(1)}C-${maxTemperature.toFixed(1)}C`,
      detail: "inside contract band",
      tone: "positive"
    },
    {
      id: "coverage",
      label: "Coverage",
      value: `${coverageAverage}%`,
      detail: `${model.chartSeries.evidenceCoverage.length} documents scored`,
      tone: coverageAverage === 100 ? "positive" : "warning"
    }
  ];

  return (
    <ShellCard
      id="charts"
      eyebrow="Signal room"
      step="04"
      title="Risk, cash, and evidence charts"
      sub="Charts mirror money-run's dense operating style, but tuned for RWA escrow evidence."
      action={<SectionBadge>4 live charts</SectionBadge>}
    >
      <div className="chart-summary-strip" aria-label="Chart summary">
        {chartSummary.map((item) => (
          <div className={`chart-summary-card chart-summary-card--${item.tone}`} key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="viz-grid chart-gallery" aria-label="Chart gallery">
        <RiskTapeChart model={model} />
        <CashflowChart model={model} />
        <TemperatureChart model={model} />
        <EvidenceCoverageChart model={model} />
      </div>
    </ShellCard>
  );
}

function iconForRole(role: WorkflowRole["role"]) {
  if (role === "Supplier") return <FileText aria-hidden="true" size={18} />;
  if (role === "ProofPay Agent") return <Bot aria-hidden="true" size={18} />;
  if (role === "Buyer") return <Banknote aria-hidden="true" size={18} />;
  if (role === "Arbiter") return <ShieldCheck aria-hidden="true" size={18} />;
  return <RadioTower aria-hidden="true" size={18} />;
}

function JourneySection({ productDepth }: { productDepth: ProductDepthModel }) {
  return (
    <ShellCard
      id="journey"
      eyebrow="Product workflow"
      step="02"
      title="Evidence-to-payment journey"
      sub="A compact product layer for intake, participant actions, scenario evaluation, and Casper ecosystem hooks."
      action={<SectionBadge>operator workbench</SectionBadge>}
    >
      <div className="journey-grid">
        <div className="journey-tabs">
          <Tabs defaultSelectedKey="intake" variant="primary">
            <Tabs.List aria-label="Product journey detail tabs">
              <Tabs.Tab id="intake">
                <ClipboardCheck aria-hidden="true" size={15} />
                Intake
              </Tabs.Tab>
              <Tabs.Tab id="roles">
                <Activity aria-hidden="true" size={15} />
                Roles
              </Tabs.Tab>
              <Tabs.Tab id="evaluation">
                <CheckCircle2 aria-hidden="true" size={15} />
                Evaluation
              </Tabs.Tab>
              <Tabs.Tab id="ecosystem">
                <GitBranch aria-hidden="true" size={15} />
                Ecosystem
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel id="intake">
              <div className="intake-head">
                <div>
                  <span>Evidence pack</span>
                  <strong>{productDepth.intake.bundleId}</strong>
                  <p>{productDepth.intake.documents.length} documents · sealed {shortHash(productDepth.intake.evidenceHash)}</p>
                </div>
                <SectionBadge tone="success">hash sealed</SectionBadge>
              </div>
              <div className="intake-grid">
                {productDepth.intake.documents.map((document) => (
                  <article className={`intake-card intake-card--${document.status}`} key={document.id}>
                    <div className="intake-card__head">
                      <FileText aria-hidden="true" size={17} />
                      <div>
                        <span>{document.source}</span>
                        <strong>{document.title}</strong>
                      </div>
                      <Chip color={chipColor(document.status)} variant="soft">{document.confidence}%</Chip>
                    </div>
                    <p>{document.extractedClaim}</p>
                    <code title={document.fingerprint}>{shortHash(document.fingerprint, 12, 8)}</code>
                  </article>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="roles">
              <div className="role-flow" aria-label="ProofPay role workflow">
                {productDepth.workflow.map((role, index) => (
                  <article className={`role-card role-card--${role.status}`} key={role.role}>
                    <div className="role-card__icon">{iconForRole(role.role)}</div>
                    <div>
                      <span>{role.role}</span>
                      <strong>{role.action}</strong>
                      <p>{role.detail}</p>
                      <em>{role.owner}</em>
                    </div>
                    <Chip color={chipColor(role.status)} variant="soft">{role.status}</Chip>
                    {index < productDepth.workflow.length - 1 ? <i aria-hidden="true" /> : null}
                  </article>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="evaluation">
              <div className="evaluation-summary">
                <div>
                  <span>Policy eval</span>
                  <strong>{productDepth.evaluation.passRate}% pass rate</strong>
                  <p>Seeded approve, hold, and reject scenarios match expected policy outcomes.</p>
                </div>
                <SectionBadge tone="success">3 scenarios</SectionBadge>
              </div>
              <div className="evaluation-matrix" role="table" aria-label="Agent evaluation matrix">
                <div className="evaluation-row evaluation-row--head" role="row">
                  <span role="columnheader">Scenario</span>
                  <span role="columnheader">Expected</span>
                  <span role="columnheader">Actual</span>
                  <span role="columnheader">Risk</span>
                  <span role="columnheader">Gate</span>
                </div>
                {productDepth.evaluation.rows.map((row) => (
                  <div className="evaluation-row" key={row.scenario} role="row">
                    <strong role="cell">{scenarioLabelFor(row.scenario)}</strong>
                    <span role="cell">{row.expectedDecision}</span>
                    <Chip color={chipColor(row.actualDecision)} variant="soft">{row.actualDecision}</Chip>
                    <code role="cell">{row.riskScore}/100 · {row.confidence}%</code>
                    <span role="cell">{row.passed ? "passed" : row.policyGate}</span>
                  </div>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="ecosystem">
              <div className="ecosystem-hooks">
                {productDepth.ecosystemHooks.map((hook) => (
                  <article className="ecosystem-card" key={hook.id}>
                    <div className="ecosystem-card__head">
                      <GitBranch aria-hidden="true" size={17} />
                      <div>
                        <span>{hook.id.replaceAll("-", " ")}</span>
                        <strong>{hook.label}</strong>
                      </div>
                      <Chip color={chipColor(hook.status)} variant="soft">{hook.status}</Chip>
                    </div>
                    <p>{hook.detail}</p>
                    <code>{hook.endpoint}</code>
                  </article>
                ))}
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </ShellCard>
  );
}

function TrustChainSection({
  bundle,
  intakeReport,
  runbook,
  attestationVerification
}: {
  bundle: EvidenceBundle;
  intakeReport: EvidenceIntakeReport;
  runbook: SettlementRunbook;
  attestationVerification: AttestationVerificationReport;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(bundle, null, 2));
  const [playgroundResult, setPlaygroundResult] = useState<PlaygroundResult>({
    status: "idle",
    message: "Load or edit an evidence package, then assess evidence."
  });
  const [apiRouteStatus, setApiRouteStatus] = useState<ApiRouteStatus>({
    status: "checking",
    message: "Checking dynamic API route availability."
  });

  useEffect(() => {
    setDraft(JSON.stringify(bundle, null, 2));
    setPlaygroundResult({
      status: "idle",
      message: `Loaded ${scenarioLabelFor(bundle.scenario)}; click Assess evidence to recompute.`
    });
  }, [bundle]);

  useEffect(() => {
    let cancelled = false;

    setApiRouteStatus({
      status: "checking",
      message: "Checking Dynamic API route /api/attestation."
    });

    fetch(`/api/attestation/${bundle.scenario}`, {
      headers: {
        accept: "application/json"
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`attestation route returned ${response.status}`);
        }

        const data = await response.json();
        if (!data?.payload?.decisionHash) {
          throw new Error("attestation route did not return a payload");
        }

        if (!cancelled) {
          setApiRouteStatus({
            status: "live",
            message: "Dynamic API route live: /api/attestation and /api/evidence/intake are reachable on this Next server."
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiRouteStatus({
            status: "static_fallback",
            message: "Static host detected: using client-side replay; local API replay available in repository."
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bundle.scenario]);

  const loadSample = (key: ScenarioKey) => {
    setDraft(JSON.stringify(seededEvidenceBundles[key], null, 2));
    setPlaygroundResult({
      status: "idle",
      message: `Loaded ${scenarioCopy[key].label}; click Assess evidence to recompute.`
    });
  };

  const assessDraft = async () => {
    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(draft);
    } catch {
      setPlaygroundResult({
        status: "invalid_json",
        message: "Invalid JSON: check commas, quotes, and object braces before assessment."
      });
      return;
    }

    const parsed = parseEvidenceBundle(parsedInput);

    if (!parsed.ok) {
      setPlaygroundResult({
        status: "invalid_bundle",
        report: parsed.report
      });
      return;
    }

    try {
      const response = await fetch("/api/evidence/intake", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify(parsed.bundle)
      });
      const data = await response.json() as EvidenceIntakeApiResponse;

      if (!response.ok || !data.accepted) {
        setPlaygroundResult({
          status: "invalid_bundle",
          report: data.report
        });
        return;
      }

      setPlaygroundResult({
        status: "assessed",
        bundle: parsed.bundle,
        report: data.report,
        assessment: data.assessment,
        evidenceHash: data.payload.evidenceHash,
        payload: data.payload,
        dossier: data.dossier,
        runbook: data.settlementRunbook,
        source: "api",
        message: "Dynamic API route POST /api/evidence/intake returned this assessment."
      });
      setApiRouteStatus({
        status: "live",
        message: "Dynamic API route live: /api/evidence/intake returned the latest assessment."
      });
    } catch {
      setPlaygroundResult({
        ...assessPlaygroundBundle(parsed.bundle, parsed.report),
        message: "Dynamic API route unavailable; static/client replay produced this assessment."
      });
      setApiRouteStatus({
        status: "static_fallback",
        message: "Dynamic intake API unavailable: using client-side replay; local API replay available in repository."
      });
    }
  };

  const trustNodes = [
    {
      id: "intake",
      label: "Evidence intake",
      value: `${intakeReport.documentsReceived} docs`,
      status: intakeReport.status,
      detail: intakeReport.summary
    },
    {
      id: "decision",
      label: "AI policy decision",
      value: runbook.operatorDecision,
      status: runbook.mode,
      detail: runbook.headline
    },
    {
      id: "control",
      label: "Human release control",
      value: runbook.readiness.find((item) => item.id === "approval")?.status ?? "manual",
      status: runbook.readiness.find((item) => item.id === "approval")?.status ?? "manual",
      detail: "Real funds still require buyer or dispute-desk action."
    },
    {
      id: "verify",
      label: "Casper verifier",
      value: attestationVerification.label,
      status: attestationVerification.status,
      detail: attestationVerification.summary
    }
  ];
  const playgroundReport = playgroundResult.status === "assessed" || playgroundResult.status === "invalid_bundle"
    ? playgroundResult.report
    : null;
  const previewCoverage = playgroundReport?.coverage ?? intakeReport.coverage;
  const intakeStatusData = [
    {
      name: "complete",
      value: intakeReport.coverage.filter((item) => item.status === "complete").length,
      color: chartColors.green
    },
    {
      name: "weak",
      value: intakeReport.coverage.filter((item) => item.status === "weak").length,
      color: chartColors.amber
    },
    {
      name: "missing",
      value: intakeReport.coverage.filter((item) => item.status === "missing").length,
      color: chartColors.red
    }
  ];
  const verifierStatusData = [
    {
      name: "passed",
      value: attestationVerification.checks.filter((item) => item.status === "passed").length,
      color: chartColors.green
    },
    {
      name: "pending",
      value: attestationVerification.checks.filter((item) => item.status === "pending").length,
      color: chartColors.amber
    },
    {
      name: "failed",
      value: attestationVerification.checks.filter((item) => item.status === "failed").length,
      color: chartColors.red
    }
  ];

  return (
    <ShellCard
      id="trust"
      eyebrow="Real-use chain"
      step="03"
      title="From evidence to verifiable payment action"
      sub="The product value is the trust chain: external evidence in, explainable AI decision, human release control, and Casper proof verification out."
      action={<SectionBadge tone={attestationVerification.status === "verified" ? "success" : "warning"}>{statusLabel(attestationVerification.status)}</SectionBadge>}
    >
      <div className="trust-chain" aria-label="ProofPay trust chain">
        {trustNodes.map((node, index) => (
          <article className={`trust-node trust-node--${node.status}`} key={node.id}>
            <div className="trust-node__marker">{index + 1}</div>
            <div>
              <span>{node.label}</span>
              <strong>{node.value}</strong>
              <p>{node.detail}</p>
            </div>
            <Chip color={chipColor(node.status)} variant="soft">{statusLabel(node.status)}</Chip>
          </article>
        ))}
      </div>

      <div className="trust-mini-charts" aria-label="Trust chain visual summary">
        <MiniBarChart data={intakeStatusData} label="Evidence coverage" maxValue={intakeReport.coverage.length} />
        <MiniBarChart data={verifierStatusData} label="Casper checks" maxValue={attestationVerification.checks.length} />
      </div>

      <div className="realuse-grid">
        <div className="intake-lab">
          <div className="realuse-head">
            <div>
              <span>Evidence intake playground</span>
              <strong>Paste or load an evidence bundle JSON</strong>
            </div>
            <Chip color={playgroundResult.status === "assessed" ? "success" : playgroundResult.status === "invalid_json" || playgroundResult.status === "invalid_bundle" ? "danger" : "warning"} variant="soft">
              {playgroundResult.status === "assessed" ? "assessed" : playgroundResult.status === "idle" ? "ready" : "needs fix"}
            </Chip>
          </div>
          <div className={`api-route-status api-route-status--${apiRouteStatus.status}`}>
            <span>API route status</span>
            <strong>{apiRouteStatus.status === "live" ? "Dynamic API route" : apiRouteStatus.status === "checking" ? "Checking API route" : "Static replay fallback"}</strong>
            <p>{apiRouteStatus.message}</p>
          </div>
          <div className="sample-loader-row" aria-label="Evidence intake sample loaders">
            <button onClick={() => loadSample("clean")} type="button">Load clean release sample</button>
            <button onClick={() => loadSample("amountMismatch")} type="button">Load hold for finance sample</button>
            <button onClick={() => loadSample("duplicateInvoice")} type="button">Load reject duplicate sample</button>
          </div>
          <textarea
            aria-label="External evidence bundle JSON"
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            value={draft}
          />
          <div className="playground-actions">
            <button className="assess-button" onClick={assessDraft} type="button">
              <ClipboardCheck aria-hidden="true" size={15} />
              Assess evidence
            </button>
            <span>Dynamic API route first; static/client replay fallback for GitHub Pages.</span>
          </div>
          <div className="intake-preview">
            {playgroundResult.status === "invalid_json" ? (
              <div className="preview-status preview-status--failed">
                <TriangleAlert aria-hidden="true" size={16} />
                <span>{playgroundResult.message}</span>
              </div>
            ) : playgroundResult.status === "assessed" ? (
              <div className="preview-status preview-status--passed">
                <CheckCircle2 aria-hidden="true" size={16} />
                <span>{playgroundResult.assessment.decision} · risk {playgroundResult.assessment.riskScore}/100 · confidence {playgroundResult.assessment.confidence}% · {playgroundResult.source === "api" ? "via API route" : "client replay"}</span>
              </div>
            ) : playgroundResult.status === "invalid_bundle" ? (
              <div className="preview-status preview-status--failed">
                <TriangleAlert aria-hidden="true" size={16} />
                <span>{playgroundResult.report.summary}</span>
              </div>
            ) : (
              <div className="preview-status preview-status--warning">
                <TriangleAlert aria-hidden="true" size={16} />
                <span>{playgroundResult.message}</span>
              </div>
            )}
            <div className="coverage-strip">
              {previewCoverage.map((item) => (
                <div className={`coverage-pill coverage-pill--${item.status}`} key={item.type}>
                  <span>{item.type.replaceAll("_", " ")}</span>
                  <strong>{statusLabel(item.status)}</strong>
                </div>
              ))}
            </div>
            {playgroundResult.status === "assessed" ? (
              <div className="playground-result-grid" aria-label="Evidence intake assessment result">
                <div>
                  <span>Decision</span>
                  <strong>{playgroundResult.assessment.decision}</strong>
                </div>
                <div>
                  <span>Risk score</span>
                  <strong>{playgroundResult.assessment.riskScore}/100</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{playgroundResult.assessment.confidence}%</strong>
                </div>
                <div>
                  <span>Evidence hash</span>
                  <code title={playgroundResult.evidenceHash}>{shortHash(playgroundResult.evidenceHash, 14, 10)}</code>
                </div>
                <div>
                  <span>Decision hash</span>
                  <code title={playgroundResult.payload.decisionHash}>{shortHash(playgroundResult.payload.decisionHash, 14, 10)}</code>
                </div>
                <div>
                  <span>mini dossier preview</span>
                  <strong>{playgroundResult.dossier.trace.filter((step) => step.status === "passed").length}/{playgroundResult.dossier.trace.length} trace passed</strong>
                </div>
              </div>
            ) : null}
            {playgroundResult.status === "assessed" ? (
              <div className="playground-detail-grid">
                <div>
                  <div className="mini-title">Reasons</div>
                  {playgroundResult.assessment.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </div>
                <div>
                  <div className="mini-title">Next reviewer actions</div>
                  {playgroundResult.runbook.actions.slice(0, 3).map((action) => (
                    <p key={action.id}>{action.actor}: {action.label}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {playgroundResult.status === "invalid_bundle" ? (
              <div className="playground-issues">
                {playgroundResult.report.issues.slice(0, 4).map((issue) => (
                  <div key={`${issue.field}-${issue.message}`}>
                    <strong>{issue.field}</strong>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <code>POST /api/evidence/intake · Dynamic API route on Next server · local API replay available in repository</code>
          </div>
        </div>

        <div className="runbook-panel">
          <div className="realuse-head">
            <div>
              <span>Settlement runbook</span>
              <strong>{runbook.releaseAmount}</strong>
            </div>
            <Chip color={chipColor(runbook.mode)} variant="soft">{statusLabel(runbook.mode)}</Chip>
          </div>
          <div className="runbook-actions">
            {runbook.actions.map((action) => (
              <article className={`runbook-action runbook-action--${action.status}`} key={action.id}>
                <div>
                  <span>{action.actor}</span>
                  <strong>{action.label}</strong>
                  <p>{action.detail}</p>
                </div>
                <Chip color={chipColor(action.status)} variant="soft">{statusLabel(action.status)}</Chip>
              </article>
            ))}
          </div>
        </div>

        <div className="verifier-panel">
          <div className="realuse-head">
            <div>
              <span>Casper verifier</span>
              <strong>{attestationVerification.label}</strong>
            </div>
            <Chip color={chipColor(attestationVerification.status)} variant="soft">{statusLabel(attestationVerification.status)}</Chip>
          </div>
          <div className="verifier-checks">
            {attestationVerification.checks.map((check) => (
              <div className={`verifier-check verifier-check--${check.status}`} key={check.id}>
                <div>
                  <span>{check.label}</span>
                  <code title={`Expected: ${check.expected} · Observed: ${check.observed}`}>{check.observed}</code>
                </div>
                <Chip color={chipColor(check.status)} variant="soft">{statusLabel(check.status)}</Chip>
              </div>
            ))}
          </div>
        </div>
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
  const warningDocuments = model.evidenceMatrix.filter((row) => row.status === "warning");
  const failedDocuments = model.evidenceMatrix.filter((row) => row.status === "failed");
  const exceptionDocuments = [...warningDocuments, ...failedDocuments];
  const followUpItems = assessment.requiredFollowUp.length
    ? assessment.requiredFollowUp
    : ["No manual follow-up required for this scenario."];
  const evidenceMeter = [
    {
      id: "matched",
      label: "Matched",
      value: matchedDocuments.length,
      total: model.evidenceMatrix.length,
      tone: "positive"
    },
    {
      id: "warning",
      label: "Warning",
      value: warningDocuments.length,
      total: model.evidenceMatrix.length,
      tone: "warning"
    },
    {
      id: "failed",
      label: "Failed",
      value: failedDocuments.length,
      total: model.evidenceMatrix.length,
      tone: "negative"
    }
  ];
  const flagItems = assessment.flags.length ? assessment.flags : ["No active risk flags"];

  return (
    <ShellCard
      id="evidence"
      eyebrow="Evidence review"
      step="05"
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
          <div className="evidence-summary-meter" aria-label="Evidence status summary">
            {evidenceMeter.map((item) => (
              <div className={`evidence-meter-item evidence-meter-item--${item.id}`} key={item.id}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}/{item.total}</strong>
                </div>
                <div className="evidence-meter-bar" aria-hidden="true">
                  <i style={{ width: `${Math.round((item.value / item.total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="review-compact-list">
            <div>
              <span>Policy</span>
              <strong>{assessment.policyVersion}</strong>
            </div>
            <div>
              <span>Exceptions</span>
              <strong>{exceptionDocuments.length}</strong>
            </div>
            <div>
              <span>Follow-up</span>
              <strong>{assessment.requiredFollowUp.length || "none"}</strong>
            </div>
            <div>
              <span>Reasons</span>
              <strong>{assessment.reasons.length}</strong>
            </div>
          </div>
        </aside>

        <div className="evidence-drilldown evidence-review-tabs">
          <Tabs defaultSelectedKey="documents" variant="primary">
            <Tabs.List aria-label="Evidence drilldown">
              <Tabs.Tab id="documents">
                <FileText aria-hidden="true" size={15} />
                Documents
              </Tabs.Tab>
              <Tabs.Tab id="claims">
                <ClipboardCheck aria-hidden="true" size={15} />
                Claims
              </Tabs.Tab>
              <Tabs.Tab id="timeline">
                <Activity aria-hidden="true" size={15} />
                Timeline
              </Tabs.Tab>
              <Tabs.Tab id="reasons">
                <CheckCircle2 aria-hidden="true" size={15} />
                Reasons
              </Tabs.Tab>
              <Tabs.Tab id="followup">
                <TriangleAlert aria-hidden="true" size={15} />
                Follow-up
              </Tabs.Tab>
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
            <Tabs.Panel id="reasons">
              <div className="reason-stack reason-stack--drilldown">
                {assessment.reasons.map((reason) => (
                  <div className="reason-pill" key={reason}>
                    <CheckCircle2 aria-hidden="true" size={14} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="followup">
              <div className="followup-list">
                {followUpItems.map((item, index) => (
                  <div className="followup-card" key={`${item}-${index}`}>
                    <div className="mini-title">{assessment.requiredFollowUp.length ? `Follow-up ${index + 1}` : "Operator follow-up"}</div>
                    <p>{item}</p>
                  </div>
                ))}
                <div className="review-flag-row" aria-label="Risk flags">
                  {flagItems.map((flag) => (
                    <Chip color={assessment.flags.length ? "warning" : "success"} key={flag} variant="soft">{flag}</Chip>
                  ))}
                </div>
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
  const verification = createCasperVerificationSummary(deployPlan);
  const proofWorkbench = createCasperProofWorkbench({ payload, deployPlan });
  const [copiedProofField, setCopiedProofField] = useState<string | null>(null);
  const copyProofValue = async (field: (typeof proofWorkbench.copyFields)[number]) => {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopiedProofField(field.id);
      window.setTimeout(() => setCopiedProofField((current) => (current === field.id ? null : current)), 1400);
    } catch {
      setCopiedProofField(null);
    }
  };
  const flowSteps = [
    {
      label: "Evidence sealed",
      value: shortHash(payload.evidenceHash),
      fullValue: payload.evidenceHash,
      icon: <ClipboardCheck aria-hidden="true" size={17} />,
      state: "complete"
    },
    {
      label: "Agent decision",
      value: payload.decision,
      fullValue: payload.decisionHash,
      icon: <Bot aria-hidden="true" size={17} />,
      state: "complete"
    },
    {
      label: "Casper write",
      value: deployment ? `block ${deployment.blockHeight}` : "pending deploy",
      fullValue: deployment?.transactionHash ?? deployPlan.cliCommand,
      icon: <RadioTower aria-hidden="true" size={17} />,
      state: deployment ? "complete" : "pending"
    },
    {
      label: "Stored proof",
      value: deployment ? shortHash(deployment.uref, 12, 8) : "URef pending",
      fullValue: deployment?.uref ?? "Deploy this scenario to create a stored attestation URef.",
      icon: <Database aria-hidden="true" size={17} />,
      state: deployment ? "complete" : "pending"
    }
  ];
  const transactionFacts = [
    { label: "Network", value: deployPlan.network, display: deployPlan.network },
    { label: "State", value: verification.detail, display: verification.label },
    {
      label: "Testnet tx",
      value: deployment?.transactionHash ?? "not recorded for this scenario",
      display: deployment ? shortHash(deployment.transactionHash, 14, 10) : "pending deploy"
    },
    {
      label: "Block",
      value: deployment ? `${deployment.blockHeight} / ${deployment.blockHash}` : "pending scenario deploy",
      display: deployment ? String(deployment.blockHeight) : "pending deploy"
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
    }
  ];
  const payloadFacts = [
    { label: "Milestone", value: payload.milestoneId, display: payload.milestoneId },
    { label: "Decision", value: payload.decision, display: payload.decision },
    { label: "Evidence hash", value: payload.evidenceHash, display: shortHash(payload.evidenceHash, 14, 10) },
    { label: "Decision hash", value: payload.decisionHash, display: shortHash(payload.decisionHash, 14, 10) },
    { label: "Agent", value: payload.agentId, display: payload.agentId },
    { label: "Public key", value: deployPlan.publicKeyHex, display: shortHash(deployPlan.publicKeyHex, 14, 10) }
  ];

  return (
    <ShellCard
      id="casper"
      eyebrow="On-chain proof"
      step="06"
      title="Casper attestation"
      sub={deployment ? "Selected scenario is anchored on Casper Testnet. ProofPay does not custody real funds in this prototype." : "This scenario is deploy-ready and waiting for a matching Testnet attestation. ProofPay does not custody real funds in this prototype."}
      action={<SectionBadge tone={deployment ? "success" : "warning"}>{deployment ? "on-chain" : "deploy-ready"}</SectionBadge>}
    >
      <div className="proof-workbench">
        <div className={`proof-status proof-status--${verification.state}`}>
          <div className="proof-status__icon">
            {verification.state === "recorded" ? (
              <CheckCircle2 aria-hidden="true" size={22} />
            ) : (
              <TriangleAlert aria-hidden="true" size={22} />
            )}
          </div>
          <div>
            <span>{verification.network}</span>
            <strong>{verification.label}</strong>
            <p>{verification.detail} This is a Testnet attestation proof. ProofPay does not custody real funds in this prototype.</p>
          </div>
          <code title={verification.primaryHash}>{shortHash(verification.primaryHash, 14, 10)}</code>
        </div>

        <div className="proof-flow" aria-label="Casper verification path">
          {flowSteps.map((step, index) => (
            <div className={`proof-flow__node proof-flow__node--${step.state}`} key={step.label}>
              <div className="proof-flow__icon">{step.icon}</div>
              <div>
                <span>{step.label}</span>
                <code title={step.fullValue}>{step.value}</code>
              </div>
              {index < flowSteps.length - 1 ? <i aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className="proof-action-row" aria-label="Casper proof actions">
          {proofWorkbench.explorerUrl ? (
            <Link className="button-link primary" href={proofWorkbench.explorerUrl} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" size={15} />
              View on cspr.live
            </Link>
          ) : null}
          {proofWorkbench.copyFields.map((field) => (
            <button className="copy-proof-button" key={field.id} onClick={() => copyProofValue(field)} type="button">
              <CopyCheck aria-hidden="true" size={15} />
              {copiedProofField === field.id ? "Copied" : field.label}
            </button>
          ))}
        </div>

        <div className="proof-verification-grid" aria-label="Casper proof verification states">
          {proofWorkbench.verificationStates.map((state) => (
            <article className={`proof-verification-card proof-verification-card--${state.status}`} key={state.id}>
              <div>
                <span>{state.label}</span>
                <strong>{statusLabel(state.status)}</strong>
              </div>
              <p>{state.detail}</p>
            </article>
          ))}
        </div>

        <div className="proof-tabs">
          <Tabs defaultSelectedKey="transaction" variant="primary">
            <Tabs.List aria-label="Casper proof detail tabs">
              <Tabs.Tab id="transaction">
                <ReceiptText aria-hidden="true" size={15} />
                Transaction
              </Tabs.Tab>
              <Tabs.Tab id="payload">
                <KeyRound aria-hidden="true" size={15} />
                Payload
              </Tabs.Tab>
              <Tabs.Tab id="command">
                <Terminal aria-hidden="true" size={15} />
                Command
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="transaction">
              <div className="proof-detail-grid">
                {transactionFacts.map((fact) => (
                  <div className="proof-stat-card" key={fact.label}>
                    <span>{fact.label}</span>
                    <code title={fact.value}>{fact.display}</code>
                  </div>
                ))}
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="payload">
              <div className="proof-detail-grid">
                {payloadFacts.map((fact) => (
                  <div className="proof-stat-card" key={fact.label}>
                    <span>{fact.label}</span>
                    <code title={fact.value}>{fact.display}</code>
                  </div>
                ))}
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="command">
              <div className="command-panel">
                <h3>{deployment ? "Reproduce deploy" : "Deploy this scenario"}</h3>
                <pre><code>{deployPlan.cliCommand}</code></pre>
                <div className="session-args">
                  {deployPlan.sessionArgs.map((arg) => (
                    <code key={arg}>{arg}</code>
                  ))}
                </div>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>

      <div className="proof-doc-links" aria-label="Casper proof documentation">
        {proofWorkbench.docsLinks.map((link) => (
          <Link href={`${repositoryBlobBaseUrl}/${link.href}`} key={link.href} rel="noreferrer" target="_blank">
            <ScrollText aria-hidden="true" size={15} />
            <span>{link.label}</span>
            <code>{link.href}</code>
          </Link>
        ))}
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
  const traceStatuses: Array<AuditDossier["trace"][number]["status"]> = ["passed", "warning", "failed", "pending"];
  const traceCounts = traceStatuses.map((status) => ({
    status,
    count: dossier.trace.filter((step) => step.status === status).length
  }));
  const traceChartData = traceCounts.map((item) => ({
    name: item.status,
    value: item.count,
    color:
      item.status === "passed"
        ? chartColors.green
        : item.status === "failed"
          ? chartColors.red
          : item.status === "warning"
            ? chartColors.amber
            : chartColors.gray
  }));
  const passedTraceCount = traceCounts.find((item) => item.status === "passed")?.count ?? 0;
  const onChainState = dossier.verification.casperTransactionHash ? "recorded" : "pending";
  const verificationFacts = [
    {
      label: "Evidence hash",
      value: dossier.verification.evidenceHash,
      display: shortHash(dossier.verification.evidenceHash, 14, 10)
    },
    {
      label: "Decision hash",
      value: dossier.verification.decisionHash,
      display: shortHash(String(dossier.verification.decisionHash), 14, 10)
    },
    {
      label: "Local tx",
      value: dossier.verification.localTransactionHash ?? "pending local transaction",
      display: dossier.verification.localTransactionHash
        ? shortHash(dossier.verification.localTransactionHash, 14, 10)
        : "pending local tx"
    },
    { label: "Network", value: dossier.verification.network, display: dossier.verification.network },
    {
      label: "Casper tx",
      value: dossier.verification.casperTransactionHash ?? "pending scenario deploy",
      display: dossier.verification.casperTransactionHash
        ? shortHash(dossier.verification.casperTransactionHash, 14, 10)
        : "pending deploy"
    },
    {
      label: "Stored URef",
      value: dossier.verification.storedURef ?? "pending scenario deploy",
      display: dossier.verification.storedURef ? shortHash(dossier.verification.storedURef, 18, 12) : "pending deploy"
    }
  ];
  const dossierJson = JSON.stringify(dossier, null, 2);

  return (
    <ShellCard
      id="dossier"
      eyebrow="Judge package"
      step="07"
      title="Audit dossier"
      sub="One portable package for the decision trace, hashes, Casper proof facts, and reproduction checklist."
      action={<SectionBadge>audit console</SectionBadge>}
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
              <span>Trace passed</span>
              <strong>{passedTraceCount}/{dossier.trace.length}</strong>
              <p>{onChainState === "recorded" ? "Casper proof recorded" : "Scenario deploy pending"}</p>
            </div>
          </div>

          <div className="dossier-visual">
            <MiniBarChart data={traceChartData} label="Audit trace distribution" maxValue={dossier.trace.length} />
          </div>

          <div className="dossier-meter" aria-label="Audit trace status distribution">
            {traceCounts.map((item) => (
              <div className={`dossier-meter__item dossier-meter__item--${item.status}`} key={item.status}>
                <span>{item.status}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
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

        <aside className="dossier-side dossier-tabs" aria-label="Portable audit package">
          <Tabs defaultSelectedKey="verification" variant="primary">
            <Tabs.List aria-label="Audit package detail tabs">
              <Tabs.Tab id="verification">
                <Layers3 aria-hidden="true" size={15} />
                Verification
              </Tabs.Tab>
              <Tabs.Tab id="checklist">
                <ListChecks aria-hidden="true" size={15} />
                Checklist
              </Tabs.Tab>
              <Tabs.Tab id="json">
                <FileJson aria-hidden="true" size={15} />
                JSON
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="verification">
              <div className="verification-panel">
                <div className="mini-title">Verification chain</div>
                {verificationFacts.map((fact) => (
                  <div className="verification-row" key={fact.label}>
                    <span>{fact.label}</span>
                    <code title={fact.value}>{fact.display}</code>
                  </div>
                ))}
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="checklist">
              <div className="checklist-panel">
                <div className="mini-title">Reviewer checklist</div>
                <ol>
                  {dossier.reviewChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="json">
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
            </Tabs.Panel>
          </Tabs>
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
  const intakeReport = useMemo(() => inspectEvidenceIntake(bundle), [bundle]);
  const attestationVerification = useMemo(
    () =>
      verifyCasperAttestation({
        payload,
        deployment: deployPlan.deployment
      }),
    [deployPlan.deployment, payload]
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
  const settlementRunbook = useMemo(
    () =>
      createSettlementRunbook({
        deal,
        milestone,
        bundle,
        assessment,
        dossier
      }),
    [assessment, bundle, deal, dossier, milestone]
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
  const productDepth = useMemo(
    () =>
      createProductDepthModel({
        deal,
        milestone,
        bundle,
        assessment,
        evidenceHash,
        allBundles: seededEvidenceBundles,
        casperRecorded: Boolean(deployPlan.deployment)
      }),
    [assessment, bundle, deal, deployPlan.deployment, evidenceHash, milestone]
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
              <Link className="button-link secondary" href="#realcase-run">
                <Terminal aria-hidden="true" size={15} />
                Run real case
              </Link>
            </div>
          </header>

          <RealCaseRunSection />
          <ScenarioSwitch scenario={scenario} setScenario={setScenario} />
          <JudgeWalkthrough activeSection={activeSection} />

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
          <JourneySection productDepth={productDepth} />
          <TrustChainSection
            attestationVerification={attestationVerification}
            bundle={bundle}
            intakeReport={intakeReport}
            runbook={settlementRunbook}
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
