# Casper Agentic Buildathon Constraints

Last reviewed: 2026-06-23

This document is the project guardrail for ProofPay Agent. Implementation, README copy, demo assets, and the DoraHacks BUIDL submission must satisfy these constraints before the project is treated as submission-ready.

## Primary Sources

- DoraHacks detail page: https://dorahacks.io/hackathon/casper-agentic-buildathon/detail
- DoraHacks track page: https://dorahacks.io/hackathon/casper-agentic-buildathon/tracks
- Casper AI Toolkit: https://www.casper.network/ai
- DoraHacks BUIDL guide: https://dorahacks.io/blog/guides/how-to-submit-a-buidl

## Timeline

- Qualification round: June 1 to June 30, 2026.
- DoraHacks displayed deadline: 2026-07-01 08:00.
- Evaluation and finalist selection: July 1 to July 5, 2026.
- Final round: July 6 to July 19, 2026.
- Final judging and winner announcement: late July 2026.

## Prize And Track

- Total prize pool: 150,000 USD.
- Cash prizes: 30,000 USD.
- x402 ecosystem credits: 100,000 USD.
- In-kind co-sponsor rewards: 20,000 USD.
- Track: Casper Innovation Track.
- Track focus: Agentic AI, DeFi, and Real-World Assets on Casper.

## Submission Path

The final project is submitted on DoraHacks through the Casper hackathon page's `Submit BUIDL` flow. The GitHub repository is a required artifact, not the final submission location.

Required public BUIDL assets:

- Open-source GitHub, GitLab, or Bitbucket repository link.
- README with setup, documentation, and usage instructions.
- Public demo video explaining the project, features, and walkthrough.
- Project description and external links on the DoraHacks BUIDL page.

The submit flow first presents an organizer disclaimer with `I Agree & Continue`. Do not click through or submit on behalf of the user without explicit confirmation at action time.

## Technical Eligibility Gates

The project must include:

- A working prototype.
- Deployment on Casper Testnet.
- A transaction-producing on-chain component.
- Original code and content newly developed for the buildathon.
- Public open-source code.

Projects that fail the technical eligibility criteria do not advance to the final round unless they are one of the top community-voted projects and still meet organizer requirements.

## Advancement Paths

- Community voting path: the top 3 projects by CSPR.fans community votes advance directly to the final round without additional judging.
- Builder merit path: all other projects must meet the technical eligibility criteria to advance for professional jury evaluation.

ProofPay Agent must be built for the builder merit path first, then packaged for CSPR.fans-friendly community presentation.

## Judging Criteria

Final round judging considers:

- Technical execution: code quality, architecture, and implementation completeness.
- Innovation and originality.
- Meaningful use of AI and agentic systems.
- Real-world applicability, especially DeFi and RWA.
- User experience and design.
- Working smart contracts on Casper Testnet.
- Long-term launch plans with project socials and actual deployment plans.
- Long-term impact on Casper ecosystem growth and adoption.

## Casper Ecosystem Alignment

The hackathon page and Casper AI Toolkit emphasize these ecosystem components:

- x402 micropayments for HTTP-native agent commerce.
- MCP servers for blockchain queries, trades, portfolio management, and contract interaction.
- CSPR.click AI Agent Skill for wallet creation, transaction signing, event handling, and CSPR.cloud API access.
- CSPR.cloud APIs for REST, Streaming, and Node API access to Casper.
- Odra Framework for AI-discoverable Casper smart contract development.
- Casper SDK and CSPR tooling.

ProofPay Agent implementation priority:

1. Odra or Casper Rust smart contract for ProofPay attestations.
2. Casper Testnet deployment and transaction hash documentation.
3. Agent assessment payload stored or referenced by the on-chain attestation.
4. UI proof panel that exposes network, Testnet transaction hash, named key, stored URef, evidence hash, decision hash, and documentation links.
5. x402/MCP/CSPR.cloud integration notes, with lightweight implementation only if it does not delay the testnet smart contract path.

## Definition Of Submission-Ready

ProofPay Agent is submission-ready only when:

- `npm run test`, `npm run typecheck`, and `npm run build` pass.
- The app runs locally and demonstrates approve, hold, and reject flows.
- The repository has README, demo script, submission checklist, and Casper testnet instructions.
- The smart contract package exists and is documented.
- A Casper Testnet transaction hash is recorded in the repository.
- The BUIDL submission draft has repository link, live/demo link if available, demo video link, and concise project copy.
