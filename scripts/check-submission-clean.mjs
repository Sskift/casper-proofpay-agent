import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function fail(message) {
  console.error(`Submission clean check failed: ${message}`);
  process.exit(1);
}

const status = git(["status", "--porcelain", "--untracked-files=all"]);

if (status) {
  fail(`working tree is not clean.\n${status}`);
}

const trackedFiles = git(["ls-files"]).split("\n").filter(Boolean);
const forbiddenTrackedPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)dist\//,
  /(^|\/)coverage\//,
  /(^|\/)target\//,
  /\.tsbuildinfo$/,
  /\.pem$/,
  /\.key$/,
  /\.secret$/,
  /(^|\/)\.env(\.|$)/
];
const forbiddenTrackedFiles = trackedFiles.filter((file) =>
  forbiddenTrackedPatterns.some((pattern) => pattern.test(file))
);

if (forbiddenTrackedFiles.length > 0) {
  fail(`generated or sensitive files are tracked:\n${forbiddenTrackedFiles.join("\n")}`);
}

const requiredFiles = [
  "README.md",
  "docs/hackathon-constraints.md",
  "docs/submission-checklist.md",
  "docs/buidl-submission-brief.md",
  "docs/demo-script.md",
  "docs/casper-testnet.md",
  "docs/casper-cli-runbook.md",
  "contracts/proofpay-attestation/README.md"
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) {
    fail(`required submission file is missing: ${file}`);
  }
}

const requiredContentChecks = [
  {
    file: "README.md",
    text: "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604"
  },
  {
    file: "docs/submission-checklist.md",
    text: "npm run submission:check"
  },
  {
    file: "docs/buidl-submission-brief.md",
    text: "ProofPay Agent"
  },
  {
    file: "docs/casper-testnet.md",
    text: "stored_uref: uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007"
  }
];

for (const check of requiredContentChecks) {
  const content = readFileSync(resolve(root, check.file), "utf8");
  if (!content.includes(check.text)) {
    fail(`${check.file} does not contain expected submission marker: ${check.text}`);
  }
}

const ignoredStatus = git(["status", "--ignored", "--porcelain"])
  .split("\n")
  .filter((line) => line.startsWith("!! "))
  .map((line) => line.slice(3));

if (ignoredStatus.length > 0) {
  console.warn("Ignored local artifacts are present but will not be submitted:");
  for (const file of ignoredStatus) {
    console.warn(`- ${file}`);
  }
}

console.log("Submission clean check passed.");

