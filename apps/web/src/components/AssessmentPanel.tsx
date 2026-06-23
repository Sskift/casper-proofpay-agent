import type { AgentAssessment } from "@proofpay/agent";
import { Bot, CircleCheck, CircleX, PauseCircle } from "lucide-react";

interface AssessmentPanelProps {
  assessment: AgentAssessment;
}

function decisionIcon(decision: AgentAssessment["decision"]) {
  if (decision === "approve") return <CircleCheck aria-hidden="true" size={18} />;
  if (decision === "hold") return <PauseCircle aria-hidden="true" size={18} />;
  return <CircleX aria-hidden="true" size={18} />;
}

export function AssessmentPanel({ assessment }: AssessmentPanelProps) {
  return (
    <section className={`panel assessment-panel decision-${assessment.decision}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Agent assessment</p>
          <h2>{assessment.decision.toUpperCase()}</h2>
        </div>
        <Bot aria-hidden="true" size={22} />
      </div>

      <div className="score-row">
        <div>
          <span>Confidence</span>
          <strong>{assessment.confidence}%</strong>
        </div>
        <div>
          <span>Risk score</span>
          <strong>{assessment.riskScore}</strong>
        </div>
        <div className="decision-pill">
          {decisionIcon(assessment.decision)}
          <strong>{assessment.decision}</strong>
        </div>
      </div>

      <div className="reason-list">
        {assessment.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>

      <div className="flag-list" aria-label="Risk flags">
        {assessment.flags.length > 0 ? (
          assessment.flags.map((flag) => <span key={flag}>{flag}</span>)
        ) : (
          <span>no_risk_flags</span>
        )}
      </div>

      <div className="claim-table" role="table" aria-label="Extracted claims">
        {assessment.extractedClaims.map((claim) => (
          <div className={`claim-row ${claim.status}`} key={`${claim.label}-${claim.source}`} role="row">
            <span role="cell">{claim.label}</span>
            <strong role="cell">{claim.value}</strong>
            <em role="cell">{claim.source}</em>
          </div>
        ))}
      </div>

      {assessment.requiredFollowUp.length > 0 ? (
        <div className="follow-up">
          <span>Required follow-up</span>
          {assessment.requiredFollowUp.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
