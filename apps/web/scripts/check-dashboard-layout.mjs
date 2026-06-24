import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

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

const requiredRouteFiles = [
  "src/app/api/proofpay-data.ts",
  "src/app/api/attestation/[scenario]/route.ts",
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

for (const [source, needle, message] of [
  [mcpRoute, "assess_milestone_evidence", "MCP route should expose the assessment tool name."],
  [mcpRoute, "get_casper_attestation", "MCP route should expose the Casper attestation lookup tool name."],
  [x402Route, "x-proofpay-demo-paid", "x402 route should require the explicit demo payment header."],
  [x402Route, "paymentRequired", "x402 route should honestly report payment-required metadata."],
  [dataRoute, "createCasperVerificationSummary", "API data helper should include Casper verification summaries."]
]) {
  if (!source.includes(needle)) {
    throw new Error(message);
  }
}
