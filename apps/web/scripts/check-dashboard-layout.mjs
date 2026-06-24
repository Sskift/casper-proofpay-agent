import { readFileSync } from "node:fs";
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
  ["readiness-grid", "Submission readiness should use visual gate cards instead of another table."],
  ['id="dossier"', "The dashboard needs a Dossier section for judge-facing audit review."],
  ["Audit dossier", "The Dossier section heading should be visible to reviewers."]
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
  [".readiness-grid", "Readiness gate card layout styles are missing."],
  [".dossier-grid", "Audit dossier layout styles are missing."],
  [".trace-grid", "Audit trace grid styles are missing."]
];

for (const [needle, message] of requiredCssContracts) {
  if (!css.includes(needle)) {
    throw new Error(message);
  }
}
