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
if (trackedFiles.includes("docs/demo/proofpay-agent-demo.mp4")) {
  fail("docs/demo/proofpay-agent-demo.mp4 is a DoraHacks upload asset and must not be tracked in Git");
}

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
  "docs/demo/proofpay-agent-demo-narration.txt",
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
    text: "Upload the final MP4 directly to the DoraHacks BUIDL form"
  },
  {
    file: "docs/casper-testnet.md",
    text: "clean_tx: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604"
  },
  {
    file: "docs/casper-testnet.md",
    text: "hold_tx: c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84"
  },
  {
    file: "docs/casper-testnet.md",
    text: "reject_tx: 08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885"
  },
  {
    file: "docs/casper-testnet.md",
    text: "current_named_key_uref: uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007"
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
