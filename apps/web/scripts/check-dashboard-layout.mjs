import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const chartsComponent = readFileSync(resolve(root, "src/components/DashboardCharts.tsx"), "utf8");
const webPackage = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const navTargets = [...page.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
const missingTargets = navTargets.filter((target) => !page.includes(`id="${target}"`));

if (missingTargets.length > 0) {
  throw new Error(`Missing dashboard nav targets: ${missingTargets.join(", ")}`);
}

const appShellBlock = css.match(/\.app-shell\s*\{[^}]*\}/)?.[0] ?? "";

if (/overflow-x\s*:\s*hidden/.test(appShellBlock)) {
  throw new Error(".app-shell must not hide overflow because it breaks the sticky sidebar during anchor navigation.");
}

const requiredPageContracts = [
  ["useScrollSpy", "The dashboard sidebar needs scroll-spy state so the active section is visible."],
  ["aria-current", "The active dashboard nav item must expose aria-current for selected-section feedback."],
  ["dashboardSections", "The dashboard nav should be generated from explicit section metadata, not a flat anchor list."],
  ["evidence-workbench", "Evidence should render as a review workbench instead of a plain table stack."],
  ["proof-workbench", "Casper proof should render as an operational proof workbench."],
  ["proof-flow", "Casper proof should show a visual transaction path instead of only text rows."],
  ["proof-tabs", "Casper proof should move transaction and command details behind secondary tabs."],
  ["readiness-grid", "Submission readiness should use visual gate cards instead of another table."],
  ['id="journey"', "The dashboard needs a Journey section for intake, roles, evaluation, and ecosystem hooks."],
  ["intake-grid", "Evidence intake should use concise ingest cards."],
  ["role-flow", "Role workflow should be visible as a product flow."],
  ["evaluation-matrix", "Agent evaluation should show scenario coverage."],
  ["ecosystem-hooks", "Casper ecosystem hooks should be visible without a long text wall."],
  ['id="commerce"', "The dashboard needs a Commerce section for runnable x402, MCP, and settlement adapter checks."],
  ["AgentCommerceSection", "The runnable agent-commerce API surface should be rendered as a dedicated workbench."],
  ["Run commerce checks", "The Commerce section should execute live API checks from the dashboard."],
  ["/api/x402/proof-review", "The dashboard should call the current x402 proof review endpoint."],
  ["/api/settlement-adapter", "The dashboard should call the settlement adapter endpoint."],
  ['id="trust"', "The dashboard needs a Trust section that explains the real evidence-to-payment chain."],
  ["TrustChainSection", "The real-use trust chain should be rendered as a dedicated workbench."],
  ["parseEvidenceBundle", "The dashboard should let reviewers validate an external evidence package."],
  ["settlementRunbook", "The dashboard should expose settlement actions, not only frontend metrics."],
  ["attestationVerification", "The dashboard should verify Casper proof fields against the current payload."],
  ["decision-spine", "Cockpit should show a compact decision spine instead of only expanded action rows."],
  ["cockpit-tabs", "Cockpit action, hash, and actor details should live in secondary tabs."],
  ["chart-summary-strip", "Charts should include a compact summary strip before drilldown charts."],
  ["chart-gallery", "Charts should render as a visible chart gallery instead of hiding most charts behind tabs."],
  ["MiniRadialGauge", "Cockpit should include compact Recharts gauges, not only metric cards."],
  ["MiniBarChart", "Trust and dossier sections should include compact Recharts summary charts."],
  ["evidence-summary-meter", "Evidence should summarize matched, warning, and failed documents before drilldown."],
  ["evidence-review-tabs", "Evidence reasons and follow-up should live in review tabs rather than an always-visible text stack."],
  ['id="dossier"', "The dashboard needs a Dossier section for judge-facing audit review."],
  ["Audit dossier", "The Dossier section heading should be visible to reviewers."],
  ["dossier-tabs", "Dossier details should be grouped into secondary tabs instead of a long side stack."],
  ["dossier-meter", "Dossier should include a compact trace meter for audit status distribution."],
  ["JudgeWalkthrough", "The dashboard needs a compact Judge walkthrough control."],
  ["judge-walkthrough", "The Judge walkthrough should have a stable, styled container."],
  ["See the release decision.", "The walkthrough should include compact Cockpit guidance."],
  ["Verify Testnet attestation.", "The walkthrough should include compact Casper guidance."],
  ["copyProofValue", "Casper proof fields should be copyable from the dashboard."],
  ["copy-proof-button", "Casper proof copy controls should use a stable button class."],
  ["View on cspr.live", "Recorded Testnet transactions should link to CSPR.live."],
  ["proofWorkbench.explorerUrl", "Casper explorer links should point to package-owned CSPR.live Testnet URLs."],
  ["ProofPay does not custody real funds in this prototype.", "Dashboard copy must preserve the no-custody boundary."],
  ["createCasperProofWorkbench", "Casper proof UI should use reusable proof workbench metadata."],
  ["Load clean release sample", "Evidence intake playground should include a clean sample loader."],
  ["Load hold for finance sample", "Evidence intake playground should include a hold sample loader."],
  ["Load reject duplicate sample", "Evidence intake playground should include a reject sample loader."],
  ["Assess evidence", "Evidence intake playground should have an explicit assessment action."],
  ["Dynamic API route", "Evidence intake playground should prefer the live Next API route before falling back to static replay."],
  ["API route status", "Dashboard should show whether dynamic API routes are reachable from this page."],
  ["mini dossier preview", "Evidence intake playground should show a compact dossier preview."],
  ["local API replay available in repository", "Static GitHub Pages mode should honestly explain local API replay."],
  ["playgroundResult", "Evidence intake playground should store explicit assessment output state."]
];

for (const [needle, message] of requiredPageContracts) {
  if (!page.includes(needle)) {
    throw new Error(message);
  }
}

const requiredCssContracts = [
  [".side-nav a.is-active", "The sidebar needs a visible active nav state."],
  [".section-frame", "Dashboard sections need a visual frame so the four areas read separately."],
  [".evidence-drilldown .tabs__tab", "Evidence drilldown tabs need control styling rather than bare stacked text."],
  [".evidence-workbench", "Evidence workbench layout styles are missing."],
  [".proof-workbench", "Casper proof workbench layout styles are missing."],
  [".proof-flow", "Casper proof flow styles are missing."],
  [".proof-tabs", "Casper proof tabs styles are missing."],
  [".readiness-grid", "Readiness gate card layout styles are missing."],
  [".journey-grid", "Journey workbench layout styles are missing."],
  [".intake-grid", "Evidence intake card styles are missing."],
  [".role-flow", "Role workflow styles are missing."],
  [".evaluation-matrix", "Evaluation matrix styles are missing."],
  [".ecosystem-hooks", "Ecosystem hook card styles are missing."],
  [".commerce-grid", "Commerce workbench layout styles are missing."],
  [".commerce-check-grid", "Commerce API check card styles are missing."],
  [".commerce-command-grid", "Commerce copy-ready command styles are missing."],
  [".trust-chain", "Trust chain layout styles are missing."],
  [".intake-lab", "External evidence intake lab styles are missing."],
  [".runbook-actions", "Settlement runbook action styles are missing."],
  [".verifier-checks", "Casper verifier check styles are missing."],
  [".decision-spine", "Cockpit decision spine styles are missing."],
  [".cockpit-tabs", "Cockpit tabs styles are missing."],
  [".chart-summary-strip", "Chart summary strip styles are missing."],
  [".chart-gallery", "Chart gallery styles are missing."],
  [".cockpit-visuals", "Cockpit mini chart layout styles are missing."],
  [".trust-mini-charts", "Trust mini chart layout styles are missing."],
  [".mini-bar-panel", "Mini Recharts bar panel styles are missing."],
  [".evidence-summary-meter", "Evidence summary meter styles are missing."],
  [".evidence-review-tabs", "Evidence review tab styles are missing."],
  [".dossier-grid", "Audit dossier layout styles are missing."],
  [".trace-grid", "Audit trace grid styles are missing."],
  [".dossier-tabs", "Dossier tab layout styles are missing."],
  [".dossier-meter", "Dossier trace meter styles are missing."],
  [".judge-walkthrough", "Judge walkthrough styles are missing."],
  [".walkthrough-step.is-active", "Judge walkthrough active state styles are missing."],
  [".sample-loader-row", "Evidence intake sample loader styles are missing."],
  [".api-route-status", "Evidence intake dynamic API route status styles are missing."],
  [".playground-result-grid", "Evidence intake result grid styles are missing."],
  [".copy-proof-button", "Casper proof copy button styles are missing."],
  [".proof-verification-grid", "Casper proof verification state styles are missing."],
  [".proof-doc-links", "Casper proof documentation link styles are missing."]
];

for (const [needle, message] of requiredCssContracts) {
  if (!css.includes(needle)) {
    throw new Error(message);
  }
}

if (!webPackage.dependencies?.recharts) {
  throw new Error("Dashboard charts should use Recharts components instead of hand-drawn SVG primitives.");
}

for (const [needle, message] of [
  ["ResponsiveContainer", "Charts should use responsive chart containers."],
  ["LineChart", "Risk and telemetry charts should use Recharts LineChart components."],
  ["BarChart", "Cashflow and evidence charts should use Recharts BarChart components."],
  ["Tooltip", "Charts should include component-level tooltips."],
  ["CartesianGrid", "Charts should use component grid rendering instead of manual grid lines."]
]) {
  if (!chartsComponent.includes(needle)) {
    throw new Error(message);
  }
}

for (const [needle, message] of [
  ["@visx/", "Dashboard charts should not depend on low-level Visx primitives."],
  ["<svg", "Dashboard charts should not hand-roll SVG containers."],
  ["<line", "Dashboard charts should not hand-roll SVG threshold lines."]
]) {
  if (chartsComponent.includes(needle)) {
    throw new Error(message);
  }
}

const requiredRouteFiles = [
  "src/app/api/proofpay-data.ts",
  "src/app/api/attestation/[scenario]/route.ts",
  "src/app/api/evidence/intake/route.ts",
  "src/app/api/mcp/route.ts",
  "src/app/api/x402/proof-review/route.ts",
  "src/app/api/settlement-adapter/route.ts"
];

for (const routeFile of requiredRouteFiles) {
  if (!existsSync(resolve(root, routeFile))) {
    throw new Error(`Missing ecosystem API route file: ${routeFile}`);
  }
}

const mcpRoute = readFileSync(resolve(root, "src/app/api/mcp/route.ts"), "utf8");
const x402ProofReviewRoute = readFileSync(resolve(root, "src/app/api/x402/proof-review/route.ts"), "utf8");
const settlementAdapterRoute = readFileSync(resolve(root, "src/app/api/settlement-adapter/route.ts"), "utf8");
const dataRoute = readFileSync(resolve(root, "src/app/api/proofpay-data.ts"), "utf8");
const intakeRoute = readFileSync(resolve(root, "src/app/api/evidence/intake/route.ts"), "utf8");

for (const [source, needle, message] of [
  [mcpRoute, "proofpay.assessEvidence", "MCP route should expose the assessment tool name."],
  [mcpRoute, "proofpay.getJudgeProof", "MCP route should expose the Casper proof lookup tool name."],
  [mcpRoute, "proofpay.getSettlementInstruction", "MCP route should expose the settlement instruction tool name."],
  [x402ProofReviewRoute, "x-proofpay-demo-paid", "x402 proof review route should require the explicit demo payment header."],
  [x402ProofReviewRoute, "paymentRequired", "x402 proof review route should honestly report payment-required metadata."],
  [x402ProofReviewRoute, "proofpay.proofReview", "x402 proof review route should expose a paid proof review service."],
  [x402ProofReviewRoute, "createSettlementInstruction", "x402 proof review route should return a settlement instruction."],
  [settlementAdapterRoute, "proofpay.api.settlementAdapter.v1", "Settlement adapter route should expose its schema."],
  [settlementAdapterRoute, "noCustody", "Settlement adapter route should state the no-custody boundary."],
  [dataRoute, "createCasperVerificationSummary", "API data helper should include Casper verification summaries."],
  [dataRoute, "verifyCasperAttestation", "API data helper should include payload-to-Testnet attestation verification."],
  [dataRoute, "createSettlementRunbook", "API data helper should include a real settlement runbook."],
  [intakeRoute, "parseEvidenceBundle", "Evidence intake route should validate external evidence bundles."],
  [intakeRoute, "buildExternalProofPayPackage", "Evidence intake route should return a full ProofPay package for external bundles."]
]) {
  if (!source.includes(needle)) {
    throw new Error(message);
  }
}
