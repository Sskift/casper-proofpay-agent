# Submission Verification Log

Verification date: `2026-06-28 13:30:39 CST`

Scope: P0/P1 submission hardening after adding the Judge Proof Pack and `GET /api/judge-proof`.

## Local Verification

| Check | Result | Notes |
| --- | --- | --- |
| `npm test` | Passed | Web API/layout tests: 6 passed. Agent tests: 15 passed. Casper tests: 9 passed. |
| `npm run typecheck` | Passed | First parallel run raced with `next build` over `.next/types`; sequential rerun passed. |
| `npm run build` | Passed | Next route table included `/api/judge-proof`. |
| `npm run pages:build` | Passed | Prepared GitHub Pages artifact at `apps/web/out`. |
| `npm run fullstack:smoke -- http://127.0.0.1:3000` | Passed | Covered health, clean attestation, judge proof, duplicate intake, invalid JSON, incomplete evidence, and real-case prepare. |

Local smoke output included:

```json
{
  "status": "ok",
  "checks": {
    "judgeProof": {
      "demoVideo": "https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4",
      "freshCaseTransaction": "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca"
    }
  }
}
```

## Public Link Checks From This Machine

| Target | Result | Evidence |
| --- | --- | --- |
| GitHub Pages static backup | Passed | `curl` returned HTTP `200`, `87166` bytes for `https://sskift.github.io/casper-proofpay-agent/`. |
| GitHub repository | Passed | `curl -I -L` returned HTTP `200` for `https://github.com/Sskift/casper-proofpay-agent`. |
| Fresh CSPR.live transaction | Passed | `curl` returned HTTP `200`, `9296` bytes for the fresh Testnet transaction page. |
| DoraHacks BUIDL public page | Blocked by site WAF | `curl` returned HTTP `405` with a human-verification page. Browser session is required for direct visual verification. |
| Vercel full-stack domain | Network timeout from this environment | `curl` and in-app browser navigation to `https://casper-proofpay-agent-web.vercel.app/api/health` timed out. |
| Vercel-hosted demo video | Network timeout from this environment | `curl -I -L` to `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4` timed out. |

## Post-push Check

- `git push origin main` completed for commit `070bad9`.
- `npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app` was retried after the push and still returned `fetch failed` from this machine.
- The in-app browser could not navigate directly to the production API route either; it timed out on the Vercel page navigation.
- This repository does not contain `.vercel/project.json`, and the Vercel CLI is not installed locally. The deployment path for this repo is the GitHub main branch integration already configured in Vercel.

## Public Proof URLs

- Live demo: `https://casper-proofpay-agent-web.vercel.app/`
- Judge proof API: `https://casper-proofpay-agent-web.vercel.app/api/judge-proof`
- Demo video: `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4`
- DoraHacks BUIDL: `https://dorahacks.io/buidl/45992`
- GitHub repo: `https://github.com/Sskift/casper-proofpay-agent`
- Static backup: `https://sskift.github.io/casper-proofpay-agent/`
- Fresh CSPR.live transaction: `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`

## Follow-up

From a network path that can reach Vercel, re-run:

```bash
npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app
```

If that network also times out on Vercel, verify the live demo and demo video from the browser session used for the final DoraHacks submission.
