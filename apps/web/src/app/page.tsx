"use client";

import { assessEvidence, createEvidenceHash, seededDeals, seededEvidenceBundles } from "@proofpay/agent";
import { createAttestationPayload, submitDemoAttestation, type DemoCasperTransaction } from "@proofpay/casper";
import { useEffect, useMemo, useState } from "react";

import { AssessmentPanel } from "@/components/AssessmentPanel";
import { DealRail } from "@/components/DealRail";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ProofPanel } from "@/components/ProofPanel";

type ScenarioKey = keyof typeof seededEvidenceBundles;

const scenarioCopy: Record<ScenarioKey, { label: string; short: string }> = {
  clean: {
    label: "Clean release",
    short: "Invoice, delivery, registry, and cold-chain evidence align."
  },
  amountMismatch: {
    label: "Hold for finance",
    short: "Shipment evidence is credible, but invoice amount exceeds the milestone."
  },
  duplicateInvoice: {
    label: "Reject duplicate",
    short: "Invoice fingerprint matches a previously settled attestation."
  }
};

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

  useEffect(() => {
    let cancelled = false;

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
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Casper Agentic Buildathon · Casper Innovation Track</p>
          <h1>ProofPay Agent</h1>
        </div>
        <div className="deadline-box" aria-label="Submission deadline">
          <span>DoraHacks deadline</span>
          <strong>2026-07-01 08:00</strong>
        </div>
      </header>

      <section className="constraint-strip" aria-label="Buildathon hard gates">
        <span>Open-source repo</span>
        <span>Demo video required</span>
        <span>Casper Testnet transaction required</span>
        <span>DoraHacks Submit BUIDL flow</span>
      </section>

      <section className="scenario-bar" aria-label="Judge mode scenarios">
        {Object.entries(scenarioCopy).map(([key, copy]) => (
          <button
            className={scenario === key ? "scenario active" : "scenario"}
            key={key}
            onClick={() => setScenario(key as ScenarioKey)}
            type="button"
          >
            <strong>{copy.label}</strong>
            <span>{copy.short}</span>
          </button>
        ))}
      </section>

      <section className="workspace" aria-label="ProofPay workflow">
        <DealRail deal={deal} milestone={milestone} assessment={assessment} />
        <EvidencePanel bundle={bundle} evidenceHash={evidenceHash} />
        <AssessmentPanel assessment={assessment} />
        <ProofPanel payload={payload} transaction={transaction} />
      </section>
    </main>
  );
}
