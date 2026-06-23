import type { AgentAssessment, Deal, Milestone } from "@proofpay/agent";
import { Banknote, CalendarClock, CheckCircle2, CircleAlert, FileWarning, ShieldCheck } from "lucide-react";

interface DealRailProps {
  deal: Deal;
  milestone: Milestone;
  assessment: AgentAssessment;
}

function decisionLabel(decision: AgentAssessment["decision"]) {
  if (decision === "approve") return "Ready to release";
  if (decision === "hold") return "Human review";
  return "Blocked";
}

export function DealRail({ deal, milestone, assessment }: DealRailProps) {
  return (
    <aside className="panel deal-rail">
      <div className="panel-header">
        <div>
          <p className="eyebrow">RWA escrow lane</p>
          <h2>{deal.name}</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={22} />
      </div>

      <dl className="metric-grid">
        <div>
          <dt>Escrow</dt>
          <dd>{deal.currency} {deal.escrowAmount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{assessment.riskScore}/100</dd>
        </div>
        <div>
          <dt>Decision</dt>
          <dd>{decisionLabel(assessment.decision)}</dd>
        </div>
        <div>
          <dt>Track</dt>
          <dd>AI + DeFi + RWA</dd>
        </div>
      </dl>

      <div className="entity-list">
        <div>
          <span>Buyer</span>
          <strong>{deal.buyer}</strong>
        </div>
        <div>
          <span>Supplier</span>
          <strong>{deal.supplier}</strong>
        </div>
        <div>
          <span>Asset</span>
          <strong>{deal.assetType}</strong>
        </div>
        <div>
          <span>Jurisdiction</span>
          <strong>{deal.jurisdiction}</strong>
        </div>
      </div>

      <div className="milestone-box">
        <div className="milestone-title">
          {assessment.decision === "approve" ? (
            <CheckCircle2 aria-hidden="true" size={18} />
          ) : assessment.decision === "hold" ? (
            <FileWarning aria-hidden="true" size={18} />
          ) : (
            <CircleAlert aria-hidden="true" size={18} />
          )}
          <strong>{milestone.title}</strong>
        </div>
        <p>{milestone.description}</p>
        <div className="milestone-meta">
          <span><Banknote aria-hidden="true" size={14} /> {milestone.currency} {milestone.amount.toLocaleString()}</span>
          <span><CalendarClock aria-hidden="true" size={14} /> {milestone.dueDate}</span>
        </div>
      </div>
    </aside>
  );
}
