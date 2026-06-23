import type { CasperAttestationPayload, CasperDeployPlan, CreateCasperDeployPlanInput } from "./types";

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
  testnetAccountFunded = false
}: CreateCasperDeployPlanInput): CasperDeployPlan {
  const sessionArgs = sessionArgsFor(payload);

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
        id: "buidl",
        label: "DoraHacks BUIDL",
        status: "manual",
        detail: "Submit repo, demo video, and Testnet hash in browser"
      }
    ],
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
