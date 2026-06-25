import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const webRoot = resolve(root, "apps/web");
const nextRoot = resolve(webRoot, ".next");
const outRoot = resolve(webRoot, "out");

const indexHtml = resolve(nextRoot, "server/app/index.html");
const notFoundHtml = resolve(nextRoot, "server/app/_not-found.html");
const staticRoot = resolve(nextRoot, "static");

for (const requiredPath of [indexHtml, staticRoot]) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing required GitHub Pages build artifact: ${requiredPath}`);
  }
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(resolve(outRoot, "_next"), { recursive: true });
await cp(indexHtml, resolve(outRoot, "index.html"));
await cp(staticRoot, resolve(outRoot, "_next/static"), { recursive: true });
await writeFile(resolve(outRoot, ".nojekyll"), "");

if (existsSync(notFoundHtml)) {
  await cp(notFoundHtml, resolve(outRoot, "404.html"));
}

console.log(`Prepared GitHub Pages artifact at ${outRoot}`);
