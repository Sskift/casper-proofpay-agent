# ProofPay Agent Demo Script

Target length: 2 to 3 minutes.

## Opening

ProofPay Agent is an autonomous milestone escrow agent for real-world assets on Casper. The use case is a temperature-controlled vaccine shipment. The buyer wants payment released only after delivery evidence is credible. The supplier wants payment without manual finance delays.

## Scene 1: Dashboard

Show the dashboard and the buildathon hard gates:

- Open-source repository.
- Demo video.
- Casper Testnet transaction requirement.
- DoraHacks Submit BUIDL flow.

Point out the escrow amount, buyer, supplier, asset type, and milestone.

## Scene 2: Clean Release

Select `Clean release`.

Explain:

- Invoice, bill of lading, delivery note, temperature log, and vendor registry align.
- The agent recommends `approve`.
- The evidence bundle hash and decision hash are generated.
- The proof panel shows the local demo transaction, the successful Casper Testnet transaction hash, block, named key, and stored URef.
- The recorded Testnet transaction proves the exact clean-scenario attestation was written on-chain.

## Scene 3: Hold For Finance

Select `Hold for finance`.

Explain:

- Delivery evidence is credible.
- Invoice amount exceeds the milestone.
- The agent chooses `hold`, flags `amount_mismatch`, and asks buyer finance to confirm the amount.

## Scene 4: Reject Duplicate

Select `Reject duplicate`.

Explain:

- Invoice fingerprint matches a previously settled invoice.
- The agent chooses `reject`.
- The decision is auditable because the payload can be anchored on Casper.

## Scene 5: Casper Contract

Open the repository contract folder:

```text
contracts/proofpay-attestation
```

Mention:

- Raw Casper Rust fallback with `call()`.
- Odra module sketch for Casper framework alignment.
- Deployment arguments match the dashboard payload.
- `npm run attestation:export -- clean` prints the exact payload used in the UI.
- `npm run contract:deploy:testnet` sends the Casper 5 `put-transaction session`.
- The successful Testnet transaction is `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604`.
- Final submission records the Casper Testnet evidence in `docs/casper-testnet.md`.

## Closing

ProofPay Agent turns off-chain RWA evidence into an auditable on-chain payment decision. AI verifies the milestone. Casper records the trust anchor. The result is faster, safer milestone escrow for real-world assets.
