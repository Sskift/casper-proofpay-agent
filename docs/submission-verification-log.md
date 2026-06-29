# Submission Verification Log

Verification date: `2026-06-29 16:46:11 CST`

Scope: P0/P1 submission hardening after adding the Judge Proof Pack, Judge Entry, and `GET /api/judge-proof`.

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
| Vercel full-stack health API | Passed | `curl` returned HTTP `200`, `2339` bytes for `https://casper-proofpay-agent-web.vercel.app/api/health`. |
| Vercel judge proof API | Passed | Returned `proofpay.api.judgeProof.v1`, `status: ok`, three seeded scenarios, and fresh transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`. |
| Vercel-hosted demo video | Passed | `curl` returned HTTP `200`, `11166614` bytes for `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4`. |

## Earlier Network Limitation

- `git push origin main` completed for commit `070bad9`.
- `npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app` was retried after the push and still returned `fetch failed` from this machine.
- The in-app browser could not navigate directly to the production API route either; it timed out on the Vercel page navigation.
- This repository does not contain `.vercel/project.json`, and the Vercel CLI is not installed locally. The deployment path for this repo is the GitHub main branch integration already configured in Vercel.
- This earlier Vercel timeout is superseded by the final public API check below.

## Final Public API Check

On `2026-06-29 16:46:11 CST`, the production smoke check passed from this machine:

```bash
npm run fullstack:smoke -- https://casper-proofpay-agent-web.vercel.app
```

The smoke covered:

- `GET /api/health`
- `GET /api/attestation/clean`
- `GET /api/judge-proof`
- `POST /api/evidence/intake`
- invalid JSON returning `400`
- incomplete evidence returning `422`
- `POST /api/real-case/prepare`

## Public Proof URLs

- Live demo: `https://casper-proofpay-agent-web.vercel.app/`
- Judge proof API: `https://casper-proofpay-agent-web.vercel.app/api/judge-proof`
- Demo video: `https://dorahacks-video.vercel.app/proofpay-agent-demo.mp4`
- DoraHacks BUIDL: `https://dorahacks.io/buidl/45992`
- GitHub repo: `https://github.com/Sskift/casper-proofpay-agent`
- Static backup: `https://sskift.github.io/casper-proofpay-agent/`
- Fresh CSPR.live transaction: `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`

## Follow-up

The only remaining manual check is the DoraHacks form itself. Direct `curl` access to `https://dorahacks.io/buidl/45992` returns a human-verification page, so the final form fields must be checked in a real browser session.
