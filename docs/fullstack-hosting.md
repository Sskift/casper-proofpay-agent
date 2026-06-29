# Full-Stack Hosting Runbook

ProofPay currently has two public modes:

- GitHub Pages static dashboard: stable and already published, but API routes cannot execute there.
- Dynamic Next.js host: required when judges should call `GET /api/*` routes from a public URL.

Verified public full-stack demo:

```text
https://casper-proofpay-agent-web.vercel.app/
```

Use this runbook to create the dynamic hosted demo without changing the product boundary. ProofPay still does not custody real funds in this prototype.

## Recommended Host

Use Vercel for the first full-stack demo because the app is a Next.js dashboard with App Router API routes.

Vercel project settings:

| Setting | Value |
| --- | --- |
| Git repository | `Sskift/casper-proofpay-agent` |
| Root Directory | `apps/web` |
| Framework Preset | `Next.js` |
| Install Command | `cd ../.. && npm install` |
| Build Command | `cd ../.. && npm run build` |
| Output Directory | leave unset / framework default |
| Node.js | `22.x` or newer |

The file [apps/web/vercel.json](../apps/web/vercel.json) records these build settings for deployments where Vercel reads project configuration from `apps/web`.

## Manual Steps

1. Open Vercel and choose `Add New -> Project`.
2. Import `Sskift/casper-proofpay-agent` from GitHub.
3. Set `Root Directory` to `apps/web`.
4. Confirm the project uses the settings above.
5. Deploy.
6. Copy the production URL, for example `https://casper-proofpay-agent-web.vercel.app`.
7. From this repository, run:

```bash
npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app
```

Expected result:

```json
{
  "status": "ok",
  "checks": {
    "health": "proofpay.api.health.v1",
    "cleanAttestation": {
      "decision": "approve"
    },
    "duplicateIntake": {
      "decision": "reject",
      "riskScore": 88
    },
    "x402ProofReview": {
      "handshake": 402,
      "decision": "reject"
    },
    "mcpSettlementInstruction": {
      "decision": "hold",
      "state": "finance-review"
    },
    "settlementAdapter": {
      "decision": "approve",
      "state": "release-ready"
    },
    "invalidJson": 400,
    "incompleteEvidence": 422
  }
}
```

## Public API Checks

After deploy, these URLs should work from a browser or curl:

```text
GET  https://YOUR-VERCEL-URL/api/health
GET  https://YOUR-VERCEL-URL/api/attestation/clean
GET  https://YOUR-VERCEL-URL/api/attestation/amountMismatch
GET  https://YOUR-VERCEL-URL/api/attestation/duplicateInvoice
POST https://YOUR-VERCEL-URL/api/evidence/intake
GET  https://YOUR-VERCEL-URL/api/mcp
POST https://YOUR-VERCEL-URL/api/mcp
POST https://YOUR-VERCEL-URL/api/x402/proof-review
POST https://YOUR-VERCEL-URL/api/settlement-adapter
```

The dashboard Trust section should show `Dynamic API route` instead of static fallback on the Vercel URL. The dashboard Commerce section should pass all four browser-run checks on the same Vercel URL.

Do not submit a random deployment URL such as `https://casper-proofpay-agent-web-...vercel.app` unless it passes the smoke check without a Vercel login. Vercel may protect deployment URLs, while the stable production domain above is public.

## What You Need To Provide

For the dynamic hosted demo:

- Vercel account access.
- GitHub authorization for Vercel to read `Sskift/casper-proofpay-agent`.
- The final Vercel production URL: `https://casper-proofpay-agent-web.vercel.app/`.
- Optional custom domain, if you want a cleaner DoraHacks link.

No API key, Casper private key, or database is required for the current dynamic demo. The current API routes recompute deterministic assessments and verify the already recorded Casper Testnet proof facts.

For a stronger real-chain pilot beyond the hosted demo:

- Casper Testnet or Mainnet account public key.
- Funded Testnet account for new attestation writes.
- A signing plan that does not expose private keys in the repository. Prefer wallet signing, a separate signing service, or Vercel environment variables only after the risk is accepted.
- Optional `CASPER_NODE_ADDRESS`, `CASPER_CHAIN_NAME`, and deployment account details for a server-side deploy worker.
- Persistent storage such as Supabase/Postgres for evidence bundles, reviewer actions, audit dossiers, transaction hashes, and URefs.

## DoraHacks Update Decision

Keep GitHub Pages as the stable fallback URL. Since the Vercel smoke check has passed:

1. Use `https://casper-proofpay-agent-web.vercel.app/` as the DoraHacks live demo URL.
2. Keep the GitHub Pages link in README as the static backup.
3. Mention that `/api/health`, `/api/evidence/intake`, `/api/x402/proof-review`, `/api/mcp`, and `/api/settlement-adapter` are publicly callable on the Vercel deployment.
4. Consider re-recording the demo video because the judge story now includes a browser-run Agent Commerce panel.
