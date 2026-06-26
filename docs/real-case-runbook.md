# Real Case Runbook

This runbook is for running one new ProofPay case from real, redacted business evidence to a fresh Casper Testnet transaction.

## Boundary

ProofPay can prepare and attest a payment decision. It does not custody real funds in this prototype. The only chain write in this runbook is a Casper Testnet attestation containing the milestone id, evidence hash, decision, decision hash, confidence, and risk score.

Private keys must stay on the operator machine. Do not paste a Casper secret key into chat, docs, GitHub, or Vercel.

## What To Provide

Create a redacted JSON file using [examples/real-case-template.json](../examples/real-case-template.json). The file should contain:

- Case ids: `id`, `dealId`, `milestoneId`, `submittedBy`, `submittedAt`, `summary`.
- Expected milestone terms: buyer, supplier, amount, currency, shipment id, temperature lower and upper bounds.
- Five evidence documents: invoice, bill of lading, delivery note, temperature log, and vendor registry.
- For each document: stable `id`, `title`, `issuedAt`, `fingerprint`, and extracted `claims`.
- Fingerprints should be hashes of the source file or record, for example `sha256:<hash>`.

Useful local fingerprint command:

```bash
shasum -a 256 path/to/source-file.pdf
```

If a document is sensitive, do not include the raw file. Include only the redacted extracted claims and a stable fingerprint.

## Recommended Video-Integrated Case

For the buildathon walkthrough, use the committed fresh case:

```text
examples/video-integrated-cold-chain-real-case.json
```

This case is the next shipment on the same Singapore to Istanbul cold-chain trade lane shown in the dashboard and demo video. It uses the same buyer and supplier, but a new shipment id, invoice id, amount, evidence fingerprints, evidence hash, and decision hash. Before its first deployment its Casper verification status was `pending`, proving it was not reusing the pre-recorded judge transactions. After the fresh deployment below, the same payload should verify as `verified`.

This case has now been executed on Casper Testnet. The public execution record is in [real-case-execution.md](real-case-execution.md).

```text
transaction_hash: d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca
block_height: 8305098
named_key: proofpay_attestation_ms-video-fresh-delivery-acceptance
stored_uref: uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007
```

## Prepare The Case

Run:

```bash
npm run realcase:prepare -- examples/video-integrated-cold-chain-real-case.json
```

Expected output:

- `schemaVersion: proofpay.realcase.prepare.v1`
- `accepted: true`
- `assessment.decision`
- `payload.evidenceHash`
- `payload.decisionHash`
- `attestationVerification.status: verified` for `examples/video-integrated-cold-chain-real-case.json`
- `attestationVerification.status: pending` for a new unmatched evidence package before deployment
- `deploy.cliCommand`

`pending` is expected before a new transaction is submitted. It means that evidence package is not reusing a recorded deployment. The committed video-integrated case is now expected to verify against transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca`.

## Hosted API Preparation

The same evidence JSON can be prepared through the public full-stack API:

```bash
curl -X POST https://casper-proofpay-agent-web.vercel.app/api/real-case/prepare \
  -H 'content-type: application/json' \
  --data @examples/video-integrated-cold-chain-real-case.json
```

The hosted API never signs a transaction and does not need a Casper private key.

For the committed video-integrated case, the hosted API should return the same evidence hash and decision hash documented in [real-case-execution.md](real-case-execution.md). The hosted API still does not submit the chain transaction; local signing remains an operator action.

## Print The Transaction Command

Run:

```bash
npm run realcase:deploy:print -- path/to/real-case.json
```

Review the generated `casper-client put-transaction session` command. Confirm the session args match the `payload` from `realcase:prepare`.

## Submit A New Casper Testnet Transaction

Only run this after the case data is correct and the Testnet account is funded:

```bash
CASPER_SECRET_KEY=/absolute/path/to/secret_key.pem \
  npm run realcase:deploy:testnet -- path/to/real-case.json
```

The deploy script will:

1. Parse and validate the real case JSON.
2. Generate a fresh evidence hash and decision hash.
3. Build the Casper Wasm contract if needed.
4. Check the funded Testnet account when the public key file is available.
5. Submit a new `put-transaction session` to Casper Testnet.

## Verify The New Transaction

After `realcase:deploy:testnet` returns a transaction hash, verify it:

```bash
casper-client get-transaction \
  --node-address https://node.testnet.casper.network \
  <NEW_TRANSACTION_HASH>
```

Open the explorer:

```text
https://testnet.cspr.live/transaction/<NEW_TRANSACTION_HASH>
```

If the deploy output or explorer shows a new stored URef, query it:

```bash
casper-client query-global-state \
  --node-address https://node.testnet.casper.network \
  --key <NEW_STORED_UREF>
```

## What I Need From You To Run Another Case Here

Provide one of these:

- A redacted `real-case.json` file path already saved in this workspace.
- Or paste the redacted JSON content into the chat.

Also tell me:

- The expected business outcome: release, hold, or reject.
- Whether the current local Casper Testnet account is allowed to spend Testnet CSPR for this proof.
- The local path to the funded `secret_key.pem`, only as a path. Do not send the key contents.
- Explicit confirmation before I run `npm run realcase:deploy:testnet`, because that submits a real Casper Testnet transaction.
