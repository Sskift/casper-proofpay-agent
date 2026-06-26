# Casper Testnet Deployment Notes

This document tracks the path from local ProofPay attestation payloads to a real Casper Testnet transaction.

## Current Status

- Local deterministic demo transactions are implemented in `packages/casper`.
- Casper contract source is present in `contracts/proofpay-attestation`.
- The contract builds to Casper-compatible Wasm with `npm run contract:build`.
- The build path uses Rust plus Binaryen `wasm-opt` to remove Casper-incompatible bulk-memory instructions.
- Real Casper Testnet transactions have executed successfully for all three judge scenarios: `clean`, `amountMismatch`, and `duplicateInvoice`.
- A fresh video-integrated real case has also executed successfully on Casper Testnet from `examples/video-integrated-cold-chain-real-case.json`.
- CLI deployment steps are captured in `docs/casper-cli-runbook.md`.
- `casper-client 5.0.1` and `cargo-casper 3.0.0` are installed locally.
- Current verified `casper-client` node address: `https://node.testnet.casper.network`.

## Local Testnet Account

Generated outside the repository:

```text
key directory: ~/.casper/proofpay-testnet-20260623
public_key_hex: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
```

Current account state:

```text
named_key: proofpay_attestation_ms-delivery-acceptance
named_key_uref_current: uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007
fresh_case_named_key: proofpay_attestation_ms-video-fresh-delivery-acceptance
fresh_case_uref: uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007
balance_after_fresh_case_deploy: 38256319936 motes
```

## Funding Path

The user's CSPR.live Testnet wallet funded the local CLI deploy account.

```text
source_wallet_public_key: 0202674c1836d2504e6c8ebefe3711c0c19f27a96ac5b43cfcec6a2c9d6a15b2462c
source_wallet_account_hash: account-hash-6dba48834d42c2872bed07179850264a21c0e8267272bf6979c6fa0690314cf0
faucet_deploy_hash: dd7b7025903cf40d03cf8224355ccefda5e4934f8fbc9be4a2bd6ebf0f06bd06
wallet_to_cli_transfer_hash: 4c08848ff32deb0734ed524f7e7efcc35b07fa1c8a743fd2e649772baccc1f6e
wallet_to_cli_transfer_amount: 100 CSPR
```

## Successful Casper Testnet Transactions

All three judge-mode scenarios now have real Casper Testnet transactions with `execution_error: null`.

| Scenario | Decision | Transaction hash | Block | Stored URef |
| --- | --- | --- | --- | --- |
| `clean` | `approve` | `94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604` | `8282603` | `uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007` |
| `amountMismatch` | `hold` | `c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84` | `8285869` | `uref-798a146f6456d0318bb0e960465a7e251321fc1ff32c36d4354bd5860a9a6d7a-007` |
| `duplicateInvoice` | `reject` | `08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885` | `8285872` | `uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007` |
| `realcase-video-coldchain-2026-06-26` | `approve` | `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` | `8305098` | `uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007` |

Each deployment writes a milestone-specific attestation string. The three seeded judge scenarios use `proofpay_attestation_ms-delivery-acceptance`; the fresh case uses `proofpay_attestation_ms-video-fresh-delivery-acceptance`. Historical URefs remain queryable by their direct URef values.

### Fresh Video-Integrated Real Case

```text
case_file: examples/video-integrated-cold-chain-real-case.json
case_id: realcase-video-coldchain-2026-06-26
transaction_hash: d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca
block_hash: 55e7f0ab1329d2edfbe779dd0df9d3a430604b33cf05d72ac153c13012ca115a
block_height: 8305098
initiator_public_key: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
initiator_account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
named_key: proofpay_attestation_ms-video-fresh-delivery-acceptance
stored_uref: uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007
execution_error: null
payment_amount: 30000000000 motes
execution_consumed: 605251254
execution_refund: 22046061559
submitted_at: 2026-06-26T07:54:11.586Z
```

The URef stores the attestation payload:

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

See [real-case-execution.md](real-case-execution.md) for the case story, public explorer link, and replay commands.

### Clean Release

```text
transaction_hash: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
block_hash: 30d1a199bb13ede3d22d6e96e3b01ef8153f203ca796ed251b3af1d2444da9e8
block_height: 8282603
initiator_public_key: 01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e
initiator_account_hash: account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d
execution_error: null
payment_amount: 30000000000 motes
execution_consumed: 574963191
execution_refund: 22068777606
submitted_at: 2026-06-24T05:54:54.131Z
```

The transaction added this account named key:

```text
proofpay_attestation_ms-delivery-acceptance:
  uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007
```

The URef stores the attestation payload:

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1",
  "decision": "approve",
  "decision_hash": "0x9f691d379eef71639e776e80d1272a464f39848d1c39566d8dfb0c0beb68f74c",
  "confidence": 94,
  "risk_score": 12
}
```

### Hold For Finance

```text
transaction_hash: c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84
block_hash: d822ed7bb4c750d032b808af0b60a5e1ab20d3458daf921a29af153e7bdb629a
block_height: 8285869
execution_error: null
stored_uref: uref-798a146f6456d0318bb0e960465a7e251321fc1ff32c36d4354bd5860a9a6d7a-007
submitted_at: 2026-06-24T13:10:25.565Z
```

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x33dfb2df8a81c21c1d2cbd296d7d076802d77bdc51c655067732397b6221e13d",
  "decision": "hold",
  "decision_hash": "0x6eee9d975141633447b306bea67554824fe39d2cb683edaa28cddf7ab8ffd96e",
  "confidence": 72,
  "risk_score": 45
}
```

### Reject Duplicate

```text
transaction_hash: 08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885
block_hash: 3416e78c68cc1d92d3e4dcf28c695f148f5867cde52c0f1d8c24b225bfc4bd96
block_height: 8285872
execution_error: null
stored_uref: uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007
submitted_at: 2026-06-24T13:10:48.355Z
```

```json
{
  "milestone_id": "ms-delivery-acceptance",
  "evidence_hash": "0x745f85d8760dde067cdf8b1e375139396e69bef7f40103209018acfea5c61ff9",
  "decision": "reject",
  "decision_hash": "0x95e24b90c3d51d52cd5babe1eaa3accb2d478c654f57ca7bb479b17cb515aa34",
  "confidence": 91,
  "risk_score": 88
}
```

## Verification Commands

Build the contract and verify it has no bulk-memory operations:

```bash
npm run contract:build
wasm2wat contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm \
  | rg "memory\\.init|data\\.drop|memory\\.copy|memory\\.fill|table\\.init|elem\\.drop|table\\.copy"
```

Query the transaction:

```bash
casper-client get-transaction \
  --node-address https://node.testnet.casper.network \
  08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885
```

Query the stored attestation:

```bash
casper-client query-global-state \
  --node-address https://node.testnet.casper.network \
  --key uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007
```

Expected stored value:

```text
CLValue String:
{"milestone_id":"ms-delivery-acceptance","evidence_hash":"0x745f85d8760dde067cdf8b1e375139396e69bef7f40103209018acfea5c61ff9","decision":"reject","decision_hash":"0x95e24b90c3d51d52cd5babe1eaa3accb2d478c654f57ca7bb479b17cb515aa34","confidence":91,"risk_score":88}
```

## Failed Attempt And Fix

An earlier transaction reached Testnet but failed execution:

```text
transaction_hash: ced413b02d54522bdd23e582f3c85c81841e53e7b4042f1439188911b94f87bf
block_height: 8282571
error: Wasm preprocessing error: Deserialization error: Bulk memory operations are not supported
```

Root cause:

- Rust's `wasm32-unknown-unknown` build still emitted `memory.copy`.
- Casper Testnet rejected the Wasm during preprocessing.

Fix:

- Build with `RUSTFLAGS="-C target-feature=-bulk-memory"`.
- Post-process with Binaryen:

```bash
wasm-opt proofpay_attestation.wasm \
  --llvm-memory-copy-fill-lowering \
  --strip-target-features \
  -Oz \
  -o proofpay_attestation.wasm
```

## DoraHacks Gate

The Casper Testnet transaction-producing component requirement is satisfied by:

```text
clean_tx: 94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604
hold_tx: c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84
reject_tx: 08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885
named_key: proofpay_attestation_ms-delivery-acceptance
current_named_key_uref: uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007
```
