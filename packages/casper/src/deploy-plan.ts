import type {
  CasperAttestationPayload,
  CasperDeployPlan,
  CasperDeploymentRecord,
  CasperProofWorkbench,
  CasperVerificationSummary,
  CreateCasperDeployPlanInput
} from "./types";

const TESTNET_EXPLORER_BASE_URL = "https://testnet.cspr.live";
const DEFAULT_NODE_ADDRESS = "https://node.testnet.casper.network";
const DEFAULT_CHAIN_NAME = "casper-test";
const DEFAULT_PAYMENT_AMOUNT = "30000000000";
const DEFAULT_GAS_PRICE_TOLERANCE = "1";
const DEFAULT_WASM_PATH =
  "contracts/proofpay-attestation/target/wasm32-unknown-unknown/release/proofpay_attestation.wasm";
const DEFAULT_SECRET_KEY_PATH = "$HOME/.casper/proofpay-testnet-20260623/secret_key.pem";
const DEFAULT_PUBLIC_KEY_HEX = "01275bb5c5b24490df3996c0ce68a1b757b27567499c8f81b9df13e29835db054e";
const DEFAULT_ACCOUNT_HASH = "account-hash-537db3bdbf915dfcfdf3568411087c4535c1b6cc15aa3e207f52d27de1cebd3d";
const DEFAULT_FAUCET_URL = "https://testnet.cspr.live/tools/faucet";
const RECORDED_TESTNET_DEPLOYMENTS: CasperDeploymentRecord[] = [
  {
    transactionHash: "94fdd43e24b713a0644b560c5f9e107cc8b6e0e317bc31b2d8d3940619511604",
    blockHash: "30d1a199bb13ede3d22d6e96e3b01ef8153f203ca796ed251b3af1d2444da9e8",
    blockHeight: 8282603,
    publicKeyHex: DEFAULT_PUBLIC_KEY_HEX,
    accountHash: DEFAULT_ACCOUNT_HASH,
    namedKey: "proofpay_attestation_ms-delivery-acceptance",
    uref: "uref-21583db858a355546ea8812cbf3104fc04880c2b32361e4848e181aba79a27a1-007",
    milestoneId: "ms-delivery-acceptance",
    evidenceHash: "0x96232bd7a6224ade903c20cb89c38cc91e036facebe837475ab41cf26a4556e1",
    decision: "approve",
    decisionHash: "0x9f691d379eef71639e776e80d1272a464f39848d1c39566d8dfb0c0beb68f74c",
    confidence: 94,
    riskScore: 12,
    submittedAt: "2026-06-24T05:54:54.131Z"
  },
  {
    transactionHash: "c92cdcd8f11f6453134745900ea2c91defa0f8b37f4c6782dd38b2aa7a720d84",
    blockHash: "d822ed7bb4c750d032b808af0b60a5e1ab20d3458daf921a29af153e7bdb629a",
    blockHeight: 8285869,
    publicKeyHex: DEFAULT_PUBLIC_KEY_HEX,
    accountHash: DEFAULT_ACCOUNT_HASH,
    namedKey: "proofpay_attestation_ms-delivery-acceptance",
    uref: "uref-798a146f6456d0318bb0e960465a7e251321fc1ff32c36d4354bd5860a9a6d7a-007",
    milestoneId: "ms-delivery-acceptance",
    evidenceHash: "0x33dfb2df8a81c21c1d2cbd296d7d076802d77bdc51c655067732397b6221e13d",
    decision: "hold",
    decisionHash: "0x6eee9d975141633447b306bea67554824fe39d2cb683edaa28cddf7ab8ffd96e",
    confidence: 72,
    riskScore: 45,
    submittedAt: "2026-06-24T13:10:25.565Z"
  },
  {
    transactionHash: "08995093b6ef978b381c4cee7d8faeb960f31bb64083544c8cfa0c3c8952e885",
    blockHash: "3416e78c68cc1d92d3e4dcf28c695f148f5867cde52c0f1d8c24b225bfc4bd96",
    blockHeight: 8285872,
    publicKeyHex: DEFAULT_PUBLIC_KEY_HEX,
    accountHash: DEFAULT_ACCOUNT_HASH,
    namedKey: "proofpay_attestation_ms-delivery-acceptance",
    uref: "uref-409325b098f841565f2667d96986d7f41ff08e606f33bf06f76a0564ac1eb76f-007",
    milestoneId: "ms-delivery-acceptance",
    evidenceHash: "0x745f85d8760dde067cdf8b1e375139396e69bef7f40103209018acfea5c61ff9",
    decision: "reject",
    decisionHash: "0x95e24b90c3d51d52cd5babe1eaa3accb2d478c654f57ca7bb479b17cb515aa34",
    confidence: 91,
    riskScore: 88,
    submittedAt: "2026-06-24T13:10:48.355Z"
  },
  {
    transactionHash: "d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca",
    blockHash: "55e7f0ab1329d2edfbe779dd0df9d3a430604b33cf05d72ac153c13012ca115a",
    blockHeight: 8305098,
    publicKeyHex: DEFAULT_PUBLIC_KEY_HEX,
    accountHash: DEFAULT_ACCOUNT_HASH,
    namedKey: "proofpay_attestation_ms-video-fresh-delivery-acceptance",
    uref: "uref-9f8050677d97d4e1560ca87c7909256a4e027d2b1a13bd1a544be0176c3fc68d-007",
    milestoneId: "ms-video-fresh-delivery-acceptance",
    evidenceHash: "0xc3102b59b3554463ab1871e1fda0b1e0791f99052426a758a3006b0da3dc5803",
    decision: "approve",
    decisionHash: "0xd20d3a10c09c7e8d0b693b553afcc4442e0323b81991d350ffc23a486ccd211d",
    confidence: 94,
    riskScore: 12,
    submittedAt: "2026-06-26T07:54:11.586Z"
  }
];

function sessionArgsFor(payload: CasperAttestationPayload): string[] {
  return [
    `milestone_id:string='${payload.milestoneId}'`,
    `evidence_hash:string='${payload.evidenceHash}'`,
    `decision:string='${payload.decision}'`,
    `decision_hash:string='${payload.decisionHash}'`,
    `confidence:u64='${payload.confidence}'`,
    `risk_score:u64='${payload.riskScore}'`
  ];
}

function createCliCommand(input: {
  nodeAddress: string;
  chainName: string;
  secretKeyPath: string;
  wasmPath: string;
  paymentAmount: string;
  gasPriceTolerance: string;
  sessionArgs: string[];
}): string {
  return [
    "casper-client put-transaction session \\",
    `  --node-address "${input.nodeAddress}" \\`,
    `  --chain-name "${input.chainName}" \\`,
    `  --secret-key "${input.secretKeyPath}" \\`,
    `  --wasm-path "${input.wasmPath}" \\`,
    `  --payment-amount "${input.paymentAmount}" \\`,
    "  --standard-payment true \\",
    `  --gas-price-tolerance "${input.gasPriceTolerance}" \\`,
    "  --install-upgrade \\",
    "  --session-entry-point call \\",
    ...input.sessionArgs.map((arg, index) => {
      const suffix = index === input.sessionArgs.length - 1 ? "" : " \\";
      return `  --session-arg "${arg}"${suffix}`;
    })
  ].join("\n");
}

export function createCasperDeployPlan({
  payload,
  scenario,
  nodeAddress = DEFAULT_NODE_ADDRESS,
  chainName = DEFAULT_CHAIN_NAME,
  secretKeyPath = DEFAULT_SECRET_KEY_PATH,
  wasmPath = DEFAULT_WASM_PATH,
  paymentAmount = DEFAULT_PAYMENT_AMOUNT,
  gasPriceTolerance = DEFAULT_GAS_PRICE_TOLERANCE,
  publicKeyHex = DEFAULT_PUBLIC_KEY_HEX,
  accountHash = DEFAULT_ACCOUNT_HASH,
  faucetUrl = DEFAULT_FAUCET_URL,
  testnetAccountFunded = true
}: CreateCasperDeployPlanInput): CasperDeployPlan {
  const sessionArgs = sessionArgsFor(payload);
  const deployment =
    RECORDED_TESTNET_DEPLOYMENTS.find(
      (record) =>
        record.decisionHash === payload.decisionHash &&
        record.evidenceHash === payload.evidenceHash &&
        record.milestoneId === payload.milestoneId
    ) ?? null;

  return {
    network: "Casper Testnet",
    nodeAddress,
    chainName,
    wasmPath,
    paymentAmount,
    gasPriceTolerance,
    secretKeyPath,
    publicKeyHex,
    accountHash,
    faucetUrl,
    readiness: [
      {
        id: "payload",
        label: "Agent attestation payload",
        status: "ready",
        detail: `${payload.decision} decision signed by ${payload.agentId}`
      },
      {
        id: "contract",
        label: "Casper Wasm contract",
        status: "ready",
        detail: "Build with npm run contract:build"
      },
      {
        id: "testnet-account",
        label: "Funded Testnet account",
        status: testnetAccountFunded ? "ready" : "blocked",
        detail: testnetAccountFunded
          ? "Account is funded and can submit the transaction"
          : "Fund this public key through CSPR.live faucet"
      },
      {
        id: "testnet-deploy",
        label: "Casper Testnet attestation",
        status: deployment ? "ready" : "manual",
        detail: deployment ? `Executed in block ${deployment.blockHeight}` : "Run the deploy script for this scenario"
      },
      {
        id: "buidl",
        label: "DoraHacks BUIDL",
        status: "manual",
        detail: "Submit repo, demo video, and Testnet hash in browser"
      }
    ],
    deployment,
    sessionArgs,
    cliCommand: createCliCommand({
      nodeAddress,
      chainName,
      secretKeyPath,
      wasmPath,
      paymentAmount,
      gasPriceTolerance,
      sessionArgs
    }),
    postFundingCommands: ["npm run casper:check", `PROOFPAY_SCENARIO="${scenario}" npm run contract:deploy:testnet`]
  };
}

export function createCasperVerificationSummary(plan: CasperDeployPlan): CasperVerificationSummary {
  if (plan.deployment) {
    return {
      state: "recorded",
      label: "Verified on Casper Testnet",
      detail: `Transaction executed in block ${plan.deployment.blockHeight} with stored attestation URef.`,
      network: plan.network,
      primaryHash: plan.deployment.transactionHash,
      checkedAt: plan.deployment.submittedAt
    };
  }

  const blockedGate = plan.readiness.find((item) => item.status === "blocked");

  if (blockedGate) {
    return {
      state: "blocked",
      label: blockedGate.label,
      detail: blockedGate.detail,
      network: plan.network,
      primaryHash: plan.accountHash,
      checkedAt: new Date(0).toISOString()
    };
  }

  const decisionHash = plan.sessionArgs
    .find((arg) => arg.startsWith("decision_hash:string="))
    ?.match(/'([^']+)'/)?.[1];

  return {
    state: "pending",
    label: "Ready for Testnet deploy",
    detail: "Payload, account, and command are ready; run the scenario deploy to create a matching Testnet attestation.",
    network: plan.network,
    primaryHash: decisionHash ?? plan.accountHash,
    checkedAt: new Date(0).toISOString()
  };
}

function verificationStatus(value: boolean, hasDeployment: boolean): "passed" | "failed" | "pending" {
  if (!hasDeployment) return "pending";
  return value ? "passed" : "failed";
}

export function createCasperProofWorkbench({
  payload,
  deployPlan
}: {
  payload: CasperAttestationPayload;
  deployPlan: CasperDeployPlan;
}): CasperProofWorkbench {
  const deployment = deployPlan.deployment;
  const hasDeployment = Boolean(deployment);
  const explorerUrl = deployment ? `${TESTNET_EXPLORER_BASE_URL}/transaction/${deployment.transactionHash}` : null;
  const storedURef = deployment?.uref ?? "pending scenario deploy";
  const transactionHash = deployment?.transactionHash ?? "pending scenario deploy";
  const hashMatches = Boolean(
    deployment &&
      deployment.evidenceHash === payload.evidenceHash &&
      deployment.decisionHash === payload.decisionHash &&
      deployment.decision === payload.decision
  );

  return {
    explorerUrl,
    copyFields: [
      {
        id: "transaction-hash",
        label: "Copy tx hash",
        value: transactionHash
      },
      {
        id: "evidence-hash",
        label: "Copy evidence hash",
        value: payload.evidenceHash
      },
      {
        id: "decision-hash",
        label: "Copy decision hash",
        value: payload.decisionHash
      },
      {
        id: "stored-uref",
        label: "Copy stored URef",
        value: storedURef
      },
      {
        id: "replay-command",
        label: "Copy replay command",
        value: deployPlan.cliCommand
      }
    ],
    verificationStates: [
      {
        id: "transaction-recorded",
        label: "Casper Testnet transaction recorded",
        status: verificationStatus(Boolean(deployment?.transactionHash), hasDeployment),
        detail: deployment ? `Block ${deployment.blockHeight}` : "No recorded Testnet transaction for this payload."
      },
      {
        id: "payload-hash-matches",
        label: "Payload hash matches current scenario",
        status: verificationStatus(hashMatches, hasDeployment),
        detail: deployment
          ? "Evidence hash, decision hash, and decision match the selected scenario."
          : "A matching deployment is required before payload comparison."
      },
      {
        id: "named-key-documented",
        label: "Named key documented",
        status: verificationStatus(Boolean(deployment?.namedKey), hasDeployment),
        detail: deployment?.namedKey ?? "Named key appears after Testnet attestation."
      },
      {
        id: "stored-uref-documented",
        label: "Stored URef documented",
        status: verificationStatus(Boolean(deployment?.uref?.startsWith("uref-")), hasDeployment),
        detail: deployment?.uref ?? "Stored URef appears after Testnet attestation."
      }
    ],
    docsLinks: [
      { label: "Casper Testnet notes", href: "docs/casper-testnet.md" },
      { label: "Casper CLI runbook", href: "docs/casper-cli-runbook.md" }
    ]
  };
}
