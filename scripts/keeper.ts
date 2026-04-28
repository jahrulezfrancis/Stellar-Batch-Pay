// scripts/keeper.ts
import {
  SorobanRpc,
  Networks,
  Keypair,
  TransactionBuilder,
  Account,
  Contract,
  Address,
  nativeToScVal
} from 'stellar-sdk';
import { createSecretsProvider } from '../lib/secrets/index';

/**
 * CONFIGURATION
 */
const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID = process.env.CONTRACT_ID;
const U32_MAX = 2 ** 32 - 1;
const MAINTENANCE_START_INDEX = readU32Env('MAINTENANCE_START_INDEX', 0);
const MAINTENANCE_LIMIT = readU32Env('MAINTENANCE_LIMIT', 10);
const BUMP_THRESHOLD_DAYS = 7;
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const LOW_BALANCE_THRESHOLD = Number(process.env.LOW_BALANCE_THRESHOLD || '50'); // XLM

if (!CONTRACT_ID) {
  console.error('MISSING CONTRACT_ID in environment');
  process.exit(1);
}

function readU32Env(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0 || value > U32_MAX) {
    throw new Error(`${name} must be an unsigned 32-bit integer`);
  }

  return value;
}

async function sendAlert(message: string) {
  console.log(`[ALERT] ${message}`);
  if (!ALERT_WEBHOOK_URL) return;

  try {
    const response = await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🚨 *Keeper Bot Alert*: ${message}` }),
    });
    if (!response.ok) {
      console.error('Failed to send alert to webhook:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending alert:', error);
  }
}

async function checkBalance(server: SorobanRpc.Server, publicKey: string) {
  try {
    const account = await server.getAccount(publicKey);
    // native balance is usually the first element in balances array
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    const balance = Number(nativeBalance?.balance || '0');

    if (balance < LOW_BALANCE_THRESHOLD) {
      await sendAlert(`Low balance warning! Sponsor wallet ${publicKey} has only ${balance} XLM remaining.`);
    }
  } catch (error) {
    console.error('Failed to check balance:', error);
  }
}

async function main() {
  // Fetch the keeper secret from the configured backend (#257).
  // Set SECRET_BACKEND=aws|github|env (default: env with a warning).
  const secrets = await createSecretsProvider();
  const keeperSecret = await secrets.fetchSecret('KEEPER_SECRET');
  const keeperKeypair = Keypair.fromSecret(keeperSecret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID!);

  console.log('Starting Keeper Bot...');
  console.log(`Contract: ${CONTRACT_ID}`);
  console.log(`Keeper: ${keeperKeypair.publicKey()}`);

  try {
    // 1. Fetch active recipients from events (simplified: assume we have a list or indexer)
    // In a production scenario, you would use an indexer or query events.
    // For this demonstration, we'll focus on the logic for a single recipient.
    const recipients = await fetchActiveRecipients();

    for (const recipient of recipients) {
      await maintainRecipient(
        recipient,
        server,
        contract,
        keeperKeypair,
        MAINTENANCE_START_INDEX,
        MAINTENANCE_LIMIT,
      );
    }

    // 2. Maintain contract instance
    await maintainInstance(server, contract, keeperKeypair);

    // 3. Proactive balance check
    await checkBalance(server, keeperKeypair.publicKey());

    console.log('Keeper Bot finished successfully.');

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Keeper execution failed:', errorMsg);
    await sendAlert(`Critical failure in Keeper Bot: ${errorMsg}`);
  }
}

async function fetchActiveRecipients(): Promise<string[]> {
  const indexerUrl = process.env.INDEXER_URL || 'https://api.stellar.expert/public';
  const contractId = CONTRACT_ID!;

  try {
    // Fetch accounts that have interacted with the contract from Stellar Expert API
    // This is a reliable indexer that tracks all contract interactions
    const response = await fetch(
      `${indexerUrl}/contract/${contractId}/interactions?limit=100&cursor=0`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch from indexer: ${response.statusText}`);
      return [];
    }

    const data = await response.json() as { records?: { account?: string }[] };
    const records = data.records ?? [];

    // Extract unique account addresses from contract interactions
    const accounts = new Set<string>();
    for (const record of records) {
      if (record.account) {
        accounts.add(record.account);
      }
    }

    const uniqueAccounts = Array.from(accounts);
    console.log(`Fetched ${uniqueAccounts.length} active recipients from indexer`);
    return uniqueAccounts;
  } catch (error) {
    console.error('Error fetching active recipients:', error);
    // Return empty list on indexer failure rather than crash
    return [];
  }
}

async function maintainInstance(
  server: SorobanRpc.Server,
  contract: Contract,
  keeperKeypair: Keypair,
) {
  console.log('Checking contract instance TTL...');
  const sourceAccount = await server.getAccount(keeperKeypair.publicKey());

  const tx = new TransactionBuilder(
    new Account(sourceAccount.accountId(), sourceAccount.sequenceNumber()),
    { fee: '100000', networkPassphrase: NETWORK_PASSPHRASE },
  )
    .addOperation(contract.call('bump_instance_ttl'))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log('Instance TTL bump not needed or failed simulation.');
    return;
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keeperKeypair);

  const result = await server.sendTransaction(preparedTx);
  console.log(`Instance TTL bumped: ${result.hash}`);
}

async function maintainRecipient(
  recipient: string,
  server: SorobanRpc.Server,
  contract: Contract,
  keeperKeypair: Keypair,
  startIndex: number,
  limit: number,
) {
  console.log(`Checking TTL for recipient: ${recipient} (${startIndex}..${startIndex + limit})`);

  const sourceAccount = await server.getAccount(keeperKeypair.publicKey());

  const tx = new TransactionBuilder(
    new Account(sourceAccount.accountId(), sourceAccount.sequenceNumber()),
    { fee: '100000', networkPassphrase: NETWORK_PASSPHRASE },
  )
    .addOperation(contract.call(
      'maintenance',
      new Address(recipient).toScVal(),
      nativeToScVal(startIndex, { type: 'u32' }),
      nativeToScVal(limit, { type: 'u32' }),
    ))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log(`Maintenance for ${recipient} not needed or failed.`);
    return;
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keeperKeypair);

  const result = await server.sendTransaction(preparedTx);
  console.log(`Maintenance completed for ${recipient} (${startIndex}..${startIndex + limit}): ${result.hash}`);
}

main();
