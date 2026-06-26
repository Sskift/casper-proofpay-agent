# Fresh Real Case Execution Record

This record documents one ProofPay case that was run end to end after the seeded judge scenarios. It is meant to be used in the final demo video and by judges who want to verify that ProofPay can process a new evidence package, not only replay the three pre-recorded scenarios.

## Business Case

| Field | Value |
| --- | --- |
| Case file | `examples/video-integrated-cold-chain-real-case.json` |
| Case id | `realcase-video-coldchain-2026-06-26` |
| Deal id | `deal-vaccine-lane-043` |
| Milestone id | `ms-video-fresh-delivery-acceptance` |
| Buyer | `Northstar Health Cooperative` |
| Supplier | `Aster Cold Chain Logistics` |
| Scenario | Follow-on cold-chain vaccine shipment on the same trade lane used in the demo video |
| Amount | `46500 USD` |
| Agent decision | `approve` |
| Confidence | `94` |
| Risk score | `12` |

ProofPay does not custody real funds in this prototype. The real chain action in this record is a Casper Testnet attestation that stores the payment decision proof.

## ProofPay Output

The case was prepared with:

```bash
npm run realcase:prepare -- examples/video-integrated-cold-chain-real-case.json
```

The generated proof fields were:

```text
decision: approve
amount: 46500
evidence_hash: 0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803
decision_hash: 0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d
```

Before the transaction was submitted, `POST /api/real-case/prepare` returned the same evidence hash and decision hash with `attestationVerification.status: pending`. That pending state confirmed the case was not reusing the recorded clean, hold, or reject deployment facts.

After the transaction below was recorded, the same prepare path is expected to return `attestationVerification.status: verified` with the deployment facts for this fresh case.

## Casper Testnet Transaction

The case was signed locally from the funded Testnet account and submitted with:

```bash
CASPER_SECRET_KEY=/absolute/path/to/secret_key.pem \
  npm run realcase:deploy:testnet -- examples/video-integrated-cold-chain-real-case.json
```

Do not paste private key contents into chat, GitHub, Vercel, or docs. The command above documents only the shape of the path-based local signing flow.

| Field | Value |
| --- | --- |
| Network | Casper Testnet |
| Transaction hash | `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` |
| Explorer | `https://testnet.cspr.live/transaction/d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` |
| Block hash | `55e7f0ab1329d2edfbe779dd0df9d3a430604b33cf05d72ac153c13012ca115a` |
| Block height | `8305098` |
| Submitted at | `2026-06-26T07:54:11.586Z` |
| Execution error | `null` |
| Initiator public key | `01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e` |
| Account hash | `account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d` |
| Named key | `proofpay_attestation_ms-video-fresh-delivery-acceptance` |
| Stored URef | `uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007` |

The URef stores:

```json
{
  "milestone_id": "ms-video-fresh-delivery-acceptance",
  "evidence_hash": "0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803",
  "decision": "approve",
  "decision_hash": "0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d",
  "confidence": 94,
  "risk_score": 12
}
```

## Verification Commands

Verify the transaction:

```bash
casper-client get-transaction \
  --node-address https://node.testnet.casper.network \
  d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca
```

Verify the account named key:

```bash
casper-client get-account \
  --node-address https://node.testnet.casper.network \
  --account-identifier ~/.casper/proofpay-testnet-20260623/public_key_hex
```

Verify the stored attestation payload:

```bash
casper-client query-global-state \
  --node-address https://node.testnet.casper.network \
  --key uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007
```

The stored payload must match the ProofPay output above. If it does, the evidence hash and decision hash produced by the agent are the same values anchored on Casper Testnet.
