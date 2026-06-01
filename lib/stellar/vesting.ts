// lib/stellar/vesting.ts - Real Soroban SDK integration (#215)
import {
  Contract,
  Networks,
  TransactionBuilder,
  Account,
  xdr,
  Address,
  nativeToScVal,
} from "stellar-sdk";
import type { PaymentInstruction, Network } from "./types";
import { acquireGuard } from "./reentrancy-guard";

const SOROBAN_RPC_URLS: Record<Network, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban-mainnet.stellar.org",
  futurenet: "https://soroban-futurenet.stellar.org",
};

/**
 * Serialize an array of Stellar addresses to ScVal Vec<Address>
 */
function addressVecToScVal(addresses: string[]): xdr.ScVal {
  return xdr.ScVal.scvVec(addresses.map((addr) => new Address(addr).toScVal()));
}

/**
 * Serialize an array of i128 amounts (in stroops) to ScVal Vec<i128>
 * Amounts are passed as string decimals; we convert to i128 stroops (7 decimal places).
 */
function amountVecToScVal(amounts: string[]): xdr.ScVal {
  return xdr.ScVal.scvVec(
    amounts.map((amt) => {
      const stroops = BigInt(Math.round(parseFloat(amt) * 1e7));
      return nativeToScVal(stroops, { type: "i128" });
    }),
  );
}

/**
 * Convert asset strings to token addresses.
 * Handles both 'XLM' (native) and 'CODE:ISSUER' (issued assets).
 */
function assetToTokenAddress(asset: string, network: Network): string {
  if (asset === "XLM") {
    // Native XLM wrapped address depends on network
    switch (network) {
      case "testnet":
        return "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // testnet
      case "mainnet":
        return "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"; // mainnet
      case "futurenet":
        return "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // futurenet (same as testnet)
    }
  }
  return asset.split(":")[1]; // Extract issuer from 'CODE:ISSUER'
}

function amountToScVal(amount: string): xdr.ScVal {
  const stroops = BigInt(Math.round(parseFloat(amount) * 1e7));
  return nativeToScVal(stroops, { type: "i128" });
}

async function buildSorobanTransaction(
  contractId: string,
  operation: ReturnType<Contract["call"]>,
  network: Network,
  publicKey: string,
): Promise<string> {
  const networkPassphrase =
    network === "mainnet"
      ? Networks.PUBLIC
      : network === "futurenet"
        ? Networks.FUTURENET
        : Networks.TESTNET;
  const rpcUrl = SOROBAN_RPC_URLS[network];

  const { rpc: SorobanRpc } = await import("stellar-sdk");
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  const sourceAccount = await server.getAccount(publicKey);
  const account = new Account(
    sourceAccount.accountId(),
    sourceAccount.sequenceNumber(),
  );

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Soroban simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toEnvelope().toXDR("base64");
}

/**
 * Build an unsigned Soroban deposit transaction XDR.
 * The returned XDR can be signed by Freighter or any other wallet and submitted via Soroban RPC.
 * #210: Supports multiple tokens in a single batch (one token per recipient).
 */
export async function buildDepositTransaction(
  contractId: string,
  payments: PaymentInstruction[],
  startTime: number,
  endTime: number,
  cliffTime: number,
  vestingStep: number,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  // Reentrancy guard: reject concurrent deposit calls for the same account (#250).
  const release = acquireGuard(publicKey, "deposit");
  try {
    const networkPassphrase =
      network === "mainnet" ? Networks.PUBLIC : network === "futurenet" ? Networks.FUTURENET : Networks.TESTNET;
    const rpcUrl = SOROBAN_RPC_URLS[network];

    // Dynamically import rpc to keep this tree-shakeable
    const { rpc: SorobanRpc } = await import("stellar-sdk");
    const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

    const sourceAccount = await server.getAccount(publicKey);
    const account = new Account(
      sourceAccount.accountId(),
      sourceAccount.sequenceNumber(),
    );

    const contract = new Contract(contractId);

    // #210: Extract tokens from each payment (one per recipient)
    const tokens = payments.map((p) => assetToTokenAddress(p.asset, network));
    const recipients = payments.map((p) => p.address);
    const amounts = payments.map((p) => p.amount);
    const memos = payments.map((p) => p.memo || "");

    const operation = contract.call(
      'deposit',
      new Address(publicKey).toScVal(),          // sender: Address
      addressVecToScVal(tokens),                  // tokens: Vec<Address>
      addressVecToScVal(recipients),              // recipients: Vec<Address>
      amountVecToScVal(amounts),                  // amounts: Vec<i128>
      nativeToScVal(BigInt(startTime), { type: 'u64' }), // start_time: u64
      nativeToScVal(BigInt(endTime), { type: 'u64' }),   // end_time: u64
      nativeToScVal(BigInt(cliffTime), { type: 'u64' }), // cliff_time: u64
      nativeToScVal(BigInt(vestingStep), { type: 'u64' }), // vesting_step: u64
      xdr.ScVal.scvVec(memos.map(m => nativeToScVal(m, { type: 'string' }))) // memos: Vec<String>
    );

    const tx = new TransactionBuilder(account, {
      fee: "1000000", // high fee ceiling; actual fee set after simulation
      networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // Simulate to populate the Soroban footprint (read/write keys + auth)
    const simResult = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Soroban simulation failed: ${simResult.error}`);
    }

    // Assemble the transaction with the simulated footprint
    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();

    // Return unsigned XDR for wallet signing
    return preparedTx.toEnvelope().toXDR("base64");
  } finally {
    release();
  }
}

/**
 * Build an unsigned transaction to claim from a vesting schedule.
 */
export async function buildClaimTransaction(
  contractId: string,
  recipient: string,
  index: number,
  amount: string,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  const contract = new Contract(contractId);
  const operation = contract.call(
    "claim",
    new Address(recipient).toScVal(),
    nativeToScVal(BigInt(index), { type: "u32" }),
    amountToScVal(amount),
  );

  return buildSorobanTransaction(contractId, operation, network, publicKey);
}

/**
 * Build an unsigned transaction to revoke a vesting schedule.
 */
export async function buildRevokeTransaction(
  contractId: string,
  recipient: string,
  index: number,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  const contract = new Contract(contractId);
  const operation = contract.call(
    "revoke",
    new Address(recipient).toScVal(),
    nativeToScVal(BigInt(index), { type: "u32" }),
  );

  return buildSorobanTransaction(contractId, operation, network, publicKey);
}

/**
 * Build an unsigned transaction to bump the contract instance TTL.
 */
export async function buildBumpInstanceTtlTransaction(
  contractId: string,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  const networkPassphrase =
    network === "mainnet" ? Networks.PUBLIC : network === "futurenet" ? Networks.FUTURENET : Networks.TESTNET;
  const rpcUrl = SOROBAN_RPC_URLS[network];

  const { rpc: SorobanRpc } = await import("stellar-sdk");
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  const sourceAccount = await server.getAccount(publicKey);
  const account = new Account(
    sourceAccount.accountId(),
    sourceAccount.sequenceNumber(),
  );

  const contract = new Contract(contractId);
  const operation = contract.call("bump_instance_ttl");

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toEnvelope().toXDR("base64");
}

/**
 * Build an unsigned transaction to transfer vesting rights to a new address.
 * Only the current recipient may authorize this call.
 * The contract does not gate this behind pause flags.
 *
 * Event note: VestingTransferred emits (new_address, old_index) in the payload;
 * the schedule index at the new address is not included until the contract is updated.
 */
export async function buildTransferVestingRightsTransaction(
  contractId: string,
  from: string,
  to: string,
  index: number,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  const contract = new Contract(contractId);
  const operation = contract.call(
    "transfer_vesting_rights",
    new Address(from).toScVal(),
    nativeToScVal(BigInt(index), { type: "u32" }),
    new Address(to).toScVal(),
  );

  return buildSorobanTransaction(contractId, operation, network, publicKey);
}

/**
 * Build an unsigned transaction to bump a specific vesting schedule TTL.
 */
export async function buildBumpVestingTtlTransaction(
  contractId: string,
  recipient: string,
  index: number,
  network: "testnet" | "mainnet",
  publicKey: string,
): Promise<string> {
  const networkPassphrase =
    network === "mainnet" ? Networks.PUBLIC : network === "futurenet" ? Networks.FUTURENET : Networks.TESTNET;
  const rpcUrl = SOROBAN_RPC_URLS[network];

  const { rpc: SorobanRpc } = await import("stellar-sdk");
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  const sourceAccount = await server.getAccount(publicKey);
  const account = new Account(
    sourceAccount.accountId(),
    sourceAccount.sequenceNumber(),
  );

  const contract = new Contract(contractId);
  const operation = contract.call(
    "bump_vesting_ttl",
    new Address(recipient).toScVal(),
    nativeToScVal(index, { type: "u32" }),
  );

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toEnvelope().toXDR("base64");
}
