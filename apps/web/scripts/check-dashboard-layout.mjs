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
