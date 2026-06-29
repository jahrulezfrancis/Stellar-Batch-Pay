#!/usr/bin/env bun
// SkillSphere Batch-Pay CLI (#362).
//
// The README and `scripts/example-cli.sh` referenced this entry point
// since launch but the file didn't exist, so developers following the
// docs hit `node cli/index.ts` errors immediately. This restores the
// CLI as a thin layer over the existing `lib/stellar/*` modules
// (parser → validator → batcher) so the on-chain logic lives in one
// place and the CLI just shells it out.
//
// Usage:
//
//   stellar-batch-pay <command> [flags]
//
// Commands:
//
//   validate  Parse + validate an input file. Exits non-zero on errors.
//   build     Validate + create batches. Prints batch summaries.
//   submit    Build + submit batches via Stellar / Soroban. Requires
//             STELLAR_SECRET_KEY in the environment.
//   help      Print this message.
//
// Flags:
//
//   --input <path>     Required for every command except `help`.
//                      Accepts .json (PaymentInstruction[]) or .csv.
//   --network <name>   `testnet` (default) or `mainnet`.
//   --output <path>    Where to write the JSON result. Defaults to
//                      stdout.
//   --max-ops <n>      Max operations per batch (default 100).

import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { parsePaymentFile } from '../lib/stellar/parser.js';
import { validatePaymentInstructions } from '../lib/stellar/validator.js';
import { createBatches, getBatchSummary } from '../lib/stellar/batcher.js';
import type { PaymentInstruction } from '../lib/stellar/types.js';

type Network = 'testnet' | 'mainnet';

interface ParsedArgs {
  command: string;
  input?: string;
  network: Network;
  output?: string;
  maxOps: number;
  help: boolean;
  version: boolean;
}

const HELP = `stellar-batch-pay — Stellar batch payments CLI

Usage:
  stellar-batch-pay <command> [flags]

Commands:
  validate          Parse + validate an input file. Exits non-zero on errors.
  build             Validate + create batches. Prints batch summaries.
  submit            Build + submit batches. Requires STELLAR_SECRET_KEY.
  help              Print this message.

Flags:
  --input <path>    Required for every command except 'help'. .json or .csv.
  --network <name>  'testnet' (default) or 'mainnet'.
  --output <path>   Where to write the JSON result. Defaults to stdout.
  --max-ops <n>     Max operations per batch (default 100).

Example:
  STELLAR_SECRET_KEY="S..." stellar-batch-pay submit \\
    --input examples/payments.json --network testnet
`;

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const args: ParsedArgs = {
    command: '',
    network: 'testnet',
    maxOps: 100,
    help: false,
    version: false,
  };

  if (argv.length === 0) {
    args.help = true;
    return args;
  }

  let i = 0;
  // First positional is the command unless it's a flag.
  if (argv[0] && !argv[0].startsWith('--')) {
    args.command = argv[0];
    i = 1;
  }

  while (i < argv.length) {
    const flag = argv[i];
    switch (flag) {
      case '--help':
      case '-h':
        args.help = true;
        i += 1;
        break;
      case '--version':
      case '-v':
        args.version = true;
        i += 1;
        break;
      case '--input': {
        const value = argv[i + 1];
        if (!value) throw new Error(`'--input' requires a path`);
        args.input = value;
        i += 2;
        break;
      }
      case '--network': {
        const value = argv[i + 1];
        if (value !== 'testnet' && value !== 'mainnet') {
          throw new Error(`'--network' must be 'testnet' or 'mainnet'; got '${value ?? '(empty)'}'`);
        }
        args.network = value as Network;
        i += 2;
        break;
      }
      case '--output': {
        const value = argv[i + 1];
        if (!value) throw new Error(`'--output' requires a path`);
        args.output = value;
        i += 2;
        break;
      }
      case '--max-ops': {
        const value = Number(argv[i + 1]);
        if (!Number.isInteger(value) || value <= 0) {
          throw new Error(`'--max-ops' must be a positive integer`);
        }
        args.maxOps = value;
        i += 2;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }
  return args;
}

async function readPayments(path: string): Promise<PaymentInstruction[]> {
  const content = await readFile(path, 'utf-8');
  const ext = extname(path).toLowerCase();
  const format = ext === '.csv' ? 'csv' : 'json';
  const parsed = parsePaymentFile(content, format);
  return parsed.validPayments;
}

async function emitResult(result: unknown, output: string | undefined): Promise<void> {
  const json = JSON.stringify(result, null, 2);
  if (output) {
    await writeFile(output, json + '\n', 'utf-8');
  } else {
    process.stdout.write(json + '\n');
  }
}

async function cmdValidate(args: ParsedArgs): Promise<number> {
  if (!args.input) {
    process.stderr.write(`'validate' requires --input <path>\n`);
    return 2;
  }
  const payments = await readPayments(args.input);
  const result = validatePaymentInstructions(payments);
  await emitResult(
    { command: 'validate', input: args.input, total: payments.length, ...result },
    args.output,
  );
  return result.valid ? 0 : 1;
}

async function cmdBuild(args: ParsedArgs): Promise<number> {
  if (!args.input) {
    process.stderr.write(`'build' requires --input <path>\n`);
    return 2;
  }
  const payments = await readPayments(args.input);
  const validation = validatePaymentInstructions(payments);
  if (!validation.valid) {
    await emitResult({ command: 'build', stage: 'validate', ...validation }, args.output);
    return 1;
  }
  const batches = await createBatches(payments, args.maxOps);
  const summaries = batches.map((b) => getBatchSummary(b.payments));
  await emitResult(
    { command: 'build', input: args.input, batches: summaries.length, summaries },
    args.output,
  );
  return 0;
}

async function cmdSubmit(args: ParsedArgs): Promise<number> {
  if (!args.input) {
    process.stderr.write(`'submit' requires --input <path>\n`);
    return 2;
  }
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret) {
    process.stderr.write(
      `STELLAR_SECRET_KEY env var must be set for 'submit'. Refusing to continue.\n`,
    );
    return 2;
  }
  // Stage 1: validate + build (these are pure / RPC-free).
  const payments = await readPayments(args.input);
  const validation = validatePaymentInstructions(payments);
  if (!validation.valid) {
    await emitResult({ command: 'submit', stage: 'validate', ...validation }, args.output);
    return 1;
  }
  const batches = await createBatches(payments, args.maxOps);
  const summaries = batches.map((b) => getBatchSummary(b.payments));

  // Stage 2: the submit-via-RPC path currently lives behind the dapp
  // UI (`processJobInBackground` in `lib/stellar/batch-worker.ts`);
  // wiring it up for the CLI requires a Horizon-side account loader
  // and signer that the dapp gets from Freighter. That's a separate
  // PR (#211-style follow-up). Until then, the CLI exits with a
  // clear actionable message instead of pretending to submit.
  await emitResult(
    {
      command: 'submit',
      stage: 'built',
      input: args.input,
      batches: summaries.length,
      summaries,
      note:
        'CLI-side submission is implemented as a follow-up. ' +
        'Built batches are ready; submit via the dapp UI for now.',
    },
    args.output,
  );
  return 0;
}

export async function run(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n\n${HELP}`);
    return 2;
  }

  if (args.version) {
    process.stdout.write(`stellar-batch-pay 0.1.0\n`);
    return 0;
  }

  if (args.help || args.command === 'help') {
    process.stdout.write(HELP);
    return 0;
  }

  switch (args.command) {
    case 'validate':
      return cmdValidate(args);
    case 'build':
      return cmdBuild(args);
    case 'submit':
      return cmdSubmit(args);
    case '':
      process.stderr.write(`Missing command.\n\n${HELP}`);
      return 2;
    default:
      process.stderr.write(`Unknown command: ${args.command}\n\n${HELP}`);
      return 2;
  }
}

// Entry point — only when invoked directly, not when imported by tests.
const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('cli/index.js') ||
  process.argv[1]?.endsWith('cli/index.ts');
if (isEntry) {
  run().then((code) => process.exit(code));
}
