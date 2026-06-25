# Dashboard Slimming Design

## Goal

Reduce dashboard density in the existing product without removing judge-critical proof, payout, and Casper information.

## Scope

This iteration slims three information-heavy areas:

1. Cockpit: keep release readiness visible, but move action, hash, and actor details into tabs.
2. Charts: show one focused chart at a time with a compact summary strip instead of rendering every chart in the first view.
3. Evidence: keep verdict and document status visible, but move long reason and follow-up text into secondary review tabs.

## Design

The primary screen should read as a command surface: a reviewer sees the decision, payout state, evidence health, and on-chain status first. Details remain one click away in tab panels, not pushed into always-visible text blocks.

Cockpit will use a compact decision spine for the current decision path and HeroUI tabs for actions, hashes, and actor handoff. Evidence will use a summary meter for matched, warning, and failed documents, plus drilldown tabs for documents, claims, timeline, reasons, and follow-up. Charts will use a tabbed chart room so risk, cashflow, cold-chain telemetry, and coverage stay available without forcing a long scroll. Chart rendering was later migrated to Recharts components for smoother tooltip, legend, animation, and responsive behavior.

## Non-Goals

- No new business logic or Casper deployments.
- No new non-UI infrastructure dependencies. Recharts is used for polished dashboard charts.
- No new demo video in this iteration.
- No hidden or fabricated proof data.

## Verification

- Extend `apps/web/scripts/check-dashboard-layout.mjs` with source contracts for the slimmer structures.
- Run the full web/source checks with `npm run test`.
- Run `npm run typecheck`, `npm run build`, and `npm run submission:check`.
- Run desktop and mobile visual checks for the updated sections.
