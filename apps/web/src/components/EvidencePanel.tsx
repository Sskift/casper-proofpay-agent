import type { EvidenceBundle } from "@proofpay/agent";
import { ClipboardCheck, FileText } from "lucide-react";

interface EvidencePanelProps {
  bundle: EvidenceBundle;
  evidenceHash: `0x${string}`;
}

export function EvidencePanel({ bundle, evidenceHash }: EvidencePanelProps) {
  return (
    <section className="panel evidence-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Evidence bundle</p>
          <h2>{bundle.summary}</h2>
        </div>
        <ClipboardCheck aria-hidden="true" size={22} />
      </div>

      <div className="hash-box">
        <span>Evidence hash</span>
        <code>{evidenceHash}</code>
      </div>

      <div className="document-table" role="table" aria-label="Submitted evidence">
        <div className="table-row table-head" role="row">
          <span role="columnheader">Document</span>
          <span role="columnheader">Fingerprint</span>
          <span role="columnheader">Key claim</span>
        </div>
        {bundle.documents.map((document) => (
          <div className="table-row" key={document.id} role="row">
            <span role="cell">
              <FileText aria-hidden="true" size={15} />
              {document.title}
            </span>
            <code role="cell">{document.fingerprint}</code>
            <span role="cell">
              {document.claims.amount
                ? `${document.claims.currency} ${document.claims.amount.toLocaleString()}`
                : document.claims.shipmentId ?? document.claims.supplier ?? "registry clear"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
