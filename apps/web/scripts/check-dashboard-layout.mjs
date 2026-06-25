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
  ['id="trust"', "The dashboard needs a Trust section that explains the real evidence-to-payment chain."],
  ["TrustChainSection", "The real-use trust chain should be rendered as a dedicated workbench."],
  ["parseEvidenceBundle", "The dashboard should let reviewers validate an external evidence package."],
  ["settlementRunbook", "The dashboard should expose settlement actions, not only frontend metrics."],
  ["attestationVerification", "The dashboard should verify Casper proof fields against the current payload."],
  ["decision-spine", "Cockpit should show a compact decision spine instead of only expanded action rows."],
  ["cockpit-tabs", "Cockpit action, hash, and actor details should live in secondary tabs."],
  ["chart-summary-strip", "Charts should include a compact summary strip before drilldown charts."],
  ["chart-tabs", "Charts should be grouped into tabs instead of rendering every chart at once."],
  ["evidence-summary-meter", "Evidence should summarize matched, warning, and failed documents before drilldown."],
  ["evidence-review-tabs", "Evidence reasons and follow-up should live in review tabs rather than an always-visible text stack."],
  ['id="dossier"', "The dashboard needs a Dossier section for judge-facing audit review."],
  ["Audit dossier", "The Dossier section heading should be visible to reviewers."],
  ["dossier-tabs", "Dossier details should be grouped into secondary tabs instead of a long side stack."],
  ["dossier-meter", "Dossier should include a compact trace meter for audit status distribution."]
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
  [".trust-chain", "Trust chain layout styles are missing."],
  [".intake-lab", "External evidence intake lab styles are missing."],
  [".runbook-actions", "Settlement runbook action styles are missing."],
  [".verifier-checks", "Casper verifier check styles are missing."],
  [".decision-spine", "Cockpit decision spine styles are missing."],
  [".cockpit-tabs", "Cockpit tabs styles are missing."],
  [".chart-summary-strip", "Chart summary strip styles are missing."],
  [".chart-tabs", "Chart tabs styles are missing."],
  [".evidence-summary-meter", "Evidence summary meter styles are missing."],
  [".evidence-review-tabs", "Evidence review tab styles are missing."],
  [".dossier-grid", "Audit dossier layout styles are missing."],
  [".trace-grid", "Audit trace grid styles are missing."],
  [".dossier-tabs", "Dossier tab layout styles are missing."],
  [".dossier-meter", "Dossier trace meter styles are missing."]
];

for (const [needle, message] of requiredCssContracts) {
  if (!css.includes(needle)) {
    throw new Error(message);
  }
}

if (!webPackage.dependencies?.["@visx/shape"] || !webPackage.dependencies?.["@visx/axis"]) {
  throw new Error("Dashboard charts should use polished visx chart components instead of hand-drawn SVG primitives.");
}

for (const [needle, message] of [
  ["LinePath", "Risk and telemetry charts should use visx LinePath components."],
  ["AxisBottom", "Charts should use chart-axis components instead of hand-positioned axis labels."],
  ["GridRows", "Charts should use chart-grid components instead of hand-positioned grid lines."],
  ["Bar", "Cashflow and evidence charts should use visx Bar components."]
]) {
  if (!chartsComponent.includes(needle)) {
    throw new Error(message);
  }
}

if (chartsComponent.includes("function linePath")) {
  throw new Error("Dashboard charts should not fall back to hand-rolled SVG drawing helpers.");
}

const requiredRouteFiles = [
  "src/app/api/proofpay-data.ts",
  "src/app/api/attestation/[scenario]/route.ts",
  "src/app/api/evidence/intake/route.ts",
  "src/app/api/mcp/route.ts",
  "src/app/api/x402/release-decision/route.ts"
];

for (const routeFile of requiredRouteFiles) {
  if (!existsSync(resolve(root, routeFile))) {
    throw new Error(`Missing ecosystem API route file: ${routeFile}`);
  }
}

const mcpRoute = readFileSync(resolve(root, "src/app/api/mcp/route.ts"), "utf8");
const x402Route = readFileSync(resolve(root, "src/app/api/x402/release-decision/route.ts"), "utf8");
const dataRoute = readFileSync(resolve(root, "src/app/api/proofpay-data.ts"), "utf8");
const intakeRoute = readFileSync(resolve(root, "src/app/api/evidence/intake/route.ts"), "utf8");

for (const [source, needle, message] of [
  [mcpRoute, "assess_milestone_evidence", "MCP route should expose the assessment tool name."],
  [mcpRoute, "get_casper_attestation", "MCP route should expose the Casper attestation lookup tool name."],
  [mcpRoute, "submit_external_evidence_pack", "MCP route should expose the external evidence intake tool name."],
  [x402Route, "x-proofpay-demo-paid", "x402 route should require the explicit demo payment header."],
  [x402Route, "paymentRequired", "x402 route should honestly report payment-required metadata."],
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
