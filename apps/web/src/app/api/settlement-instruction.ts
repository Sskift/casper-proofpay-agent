import type { Decision, SettlementRunbook } from "@proofpay/agent";

type SettlementState = "release-ready" | "finance-review" | "dispute-blocked";

const stateByDecision: Record<Decision, SettlementState> = {
  approve: "release-ready",
  hold: "finance-review",
  reject: "dispute-blocked"
};

const paymentRailActionByDecision: Record<Decision, string> = {
  approve: "Prepare release transaction for human signature.",
  hold: "Route exception to finance before any payment instruction is signed.",
  reject: "Keep payment blocked and open dispute review."
};

export function createSettlementInstruction({
  decision,
  settlementRunbook
}: {
  decision: Decision;
  settlementRunbook: SettlementRunbook;
}) {
  return {
    state: stateByDecision[decision],
    operatorDecision: settlementRunbook.operatorDecision,
    paymentRailAction: paymentRailActionByDecision[decision],
    humanApprovalRequired: true,
    custody: "external",
    mode: settlementRunbook.mode,
    releaseAmount: settlementRunbook.releaseAmount,
    headline: settlementRunbook.headline,
    actions: settlementRunbook.actions,
    readiness: settlementRunbook.readiness
  };
}

