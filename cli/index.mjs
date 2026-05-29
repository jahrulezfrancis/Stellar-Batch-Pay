#!/usr/bin/env node
/**
 * Stellar BatchPay CLI (#362)
 *
 * Three subcommands wrapping the same parser, validator, and submission
 * flow the web UI uses:
 *
 *   validate <input>            Parse + validate a JSON / CSV payment file
 *                               and report any rejected rows.
 *   build    <input>            Same as `validate`, but additionally builds
 *                               (does not sign or submit) a single Stellar
 *                               transaction XDR per batch. Prints the XDRs
 *                               so they can be signed with an external tool
 *                               (Freighter, Ledger, lab.stellar.org, etc.).
 *   submit   <input>            `build` + sign with `STELLAR_SECRET_KEY` +
 *                               submit to the chosen Horizon network.
 *
 * Common flags:
 *   --network testnet|mainnet   (default: testnet)
 *   --output  <path>            Write a JSON summary to <path>
 *   --batch-size <n>            Operations per Stellar transaction (default: 100)
 *   --memo <text>               Optional transaction-level memo
 *   --help, -h                  Show this message
 *   --version, -v               Show the CLI version
 *
 * The CLI is intentionally a single self-contained file with zero new
 * dependencies — it imports the same `stellar-sdk` and `papaparse` packages
 * the rest of the project already uses.
 */

import { promises as fs } from "node:fs";
import { resolve as resolvePath, extname } from "node:path";

const PKG_NAME = "stellar-batch-pay";
const PKG_VERSION = "0.1.0";
const DEFAULT_BATCH_SIZE = 100;
const MAX_UPLOAD_ROWS = 1000;

// ── Argument parsing ──────────────────────────────────────────────────────

/** @typedef {{
 *   command: string | null,
 *   positional: string[],
 *   flags: Record<string, string | boolean>,
 * }} ParsedArgs
 */

/** @returns {ParsedArgs} */
function parseArgs(argv) {
  const result = { command: null, positional: [], flags: {} };
  const args = argv.slice(2);
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === "--help" || a === "-h") {
      result.flags.help = true;
    } else if (a === "--version" || a === "-v") {
      result.flags.version = true;
    } else if (a.startsWith("--")) {
      const name = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith("--")) {
        result.flags[name] = true;
      } else {
        result.flags[name] = next;
        i++;
      }
    } else if (a.startsWith("-")) {
      result.flags[a.slice(1)] = true;
    } else if (result.command === null) {
      result.command = a;
    } else {
      result.positional.push(a);
    }
    i++;
  }
  return result;
}

function printUsage() {
  process.stdout.write(
    [
      `${PKG_NAME} v${PKG_VERSION}`,
      "",
      "Usage:",
      `  ${PKG_NAME} validate <input>`,
      `  ${PKG_NAME} build    <input> [--batch-size N] [--memo TEXT]`,
      `  ${PKG_NAME} submit   <input> [--network testnet|mainnet] [--output FILE]`,
      "",
      "Common flags:",
      "  --network testnet|mainnet   default: testnet",
      "  --output <path>             write JSON summary to <path>",
      "  --batch-size <n>            ops per Stellar transaction (default 100)",
      "  --memo <text>               optional transaction memo",
      "  --help, -h                  show this message",
      "  --version, -v               show the CLI version",
      "",
      "Environment:",
      "  STELLAR_SECRET_KEY          required for `submit` (S… 56 chars)",
      "",
    ].join("\n"),
  );
}

// ── File parsing (mirrors lib/stellar/parser.ts JSON + CSV happy paths) ───

function sanitizeValue(value) {
  if (!value) return "";
  let sanitized = String(value).replace(/<[^>]*>?/gm, "");
  if (/^[=+\-@]/.test(sanitized)) sanitized = `'${sanitized}`;
  return sanitized.trim();
}

async function parsePaymentFile(path) {
  const raw = await fs.readFile(path, "utf-8");
  const ext = extname(path).toLowerCase();
  if (ext === ".json") return parseJSON(raw);
  if (ext === ".csv") return parseCSV(raw);
  throw new Error(`Unsupported file extension: ${ext} (use .json or .csv)`);
}

function parseJSON(content) {
  const data = JSON.parse(content);
  const rows = Array.isArray(data) ? data : data.payments;
  if (!Array.isArray(rows)) {
    throw new Error('Expected an array or an object with a "payments" array');
  }
  if (rows.length > MAX_UPLOAD_ROWS) {
    throw new Error(`Too many rows: ${rows.length} (max ${MAX_UPLOAD_ROWS})`);
  }
  return rows.map((row) => ({
    address: String(row.address ?? "").trim(),
    amount: String(row.amount ?? "").trim(),
    asset: String(row.asset ?? "").trim(),
    memo: row.memo ? String(row.memo).trim() : undefined,
    memoType: row.memoType ? String(row.memoType).trim() : undefined,
  }));
}

async function parseCSV(content) {
  const { default: Papa } = await import("papaparse");
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transform: sanitizeValue,
  });
  if (parsed.errors?.length) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  }
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  if (rows.length > MAX_UPLOAD_ROWS) {
    throw new Error(`Too many rows: ${rows.length} (max ${MAX_UPLOAD_ROWS})`);
  }
  return rows.map((row) => ({
    address: String(row.address ?? "").trim(),
    amount: String(row.amount ?? "").trim(),
    asset: String(row.asset ?? "").trim(),
    memo: row.memo ? String(row.memo).trim() : undefined,
    memoType: row.memoType ? String(row.memoType).trim() : undefined,
  }));
}

// ── Validation (mirrors lib/stellar/validator.ts essentials) ──────────────

async function validateRow(row, index, StrKey) {
  if (!row.address) return `row ${index}: missing address`;
  if (!StrKey.isValidEd25519PublicKey(row.address)) {
    return `row ${index}: invalid Stellar address`;
  }
  if (!row.amount) return `row ${index}: missing amount`;
  const n = Number(row.amount);
  if (!Number.isFinite(n) || n <= 0) {
    return `row ${index}: amount must be a positive number, got "${row.amount}"`;
  }
  if (!row.asset) return `row ${index}: missing asset`;
  if (row.asset !== "XLM" && !row.asset.includes(":")) {
    return `row ${index}: non-XLM asset must be "CODE:ISSUER", got "${row.asset}"`;
  }
  return null;
}

async function validateRows(rows) {
  const sdk = await import("stellar-sdk");
  const StrKey = sdk.StrKey;
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const err = await validateRow(rows[i], i + 1, StrKey);
    if (err) errors.push(err);
  }
  return { errors, validRowCount: rows.length - errors.length };
}

// ── Batching ──────────────────────────────────────────────────────────────

function chunkBatches(rows, size) {
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

// ── Transaction building ──────────────────────────────────────────────────

async function buildTransactionXDR({ source, batch, network, memo, sdk }) {
  const { Asset, Memo, Networks, Operation, TransactionBuilder } = sdk;
  const passphrase = network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  const fee = String(100 * batch.length); // base fee per op
  const account = await source.server.loadAccount(source.publicKey);
  const builder = new TransactionBuilder(account, { fee, networkPassphrase: passphrase });

  for (const row of batch) {
    const asset =
      row.asset === "XLM"
        ? Asset.native()
        : new Asset(row.asset.split(":")[0], row.asset.split(":")[1]);
    builder.addOperation(
      Operation.payment({
        destination: row.address,
        asset,
        amount: row.amount,
      }),
    );
  }
  if (memo) builder.addMemo(Memo.text(memo.slice(0, 28)));
  const tx = builder.setTimeout(120).build();
  return tx;
}

// ── Subcommands ───────────────────────────────────────────────────────────

async function cmdValidate(inputPath) {
  const rows = await parsePaymentFile(inputPath);
  const { errors, validRowCount } = await validateRows(rows);
  process.stdout.write(
    JSON.stringify(
      { command: "validate", input: inputPath, validRowCount, errors },
      null,
      2,
    ) + "\n",
  );
  return errors.length === 0 ? 0 : 1;
}

async function cmdBuild(inputPath, opts) {
  const rows = await parsePaymentFile(inputPath);
  const { errors } = await validateRows(rows);
  if (errors.length > 0) {
    process.stderr.write(`Refusing to build: ${errors.length} validation error(s)\n`);
    process.stderr.write(errors.slice(0, 5).join("\n") + "\n");
    return 1;
  }
  const sdk = await import("stellar-sdk");
  const batchSize = Number(opts.batchSize) > 0 ? Number(opts.batchSize) : DEFAULT_BATCH_SIZE;
  const batches = chunkBatches(rows, batchSize);
  const network = opts.network === "mainnet" ? "mainnet" : "testnet";
  const horizonUrl =
    network === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  const server = new sdk.Horizon.Server(horizonUrl);
  const secret = process.env.STELLAR_SECRET_KEY;
  const sourceKp = secret ? sdk.Keypair.fromSecret(secret) : null;
  if (!sourceKp) {
    process.stderr.write(
      "build requires STELLAR_SECRET_KEY in the environment to derive the source account\n",
    );
    return 1;
  }
  const summary = {
    command: "build",
    input: inputPath,
    network,
    batchCount: batches.length,
    transactions: [],
  };
  for (const batch of batches) {
    const tx = await buildTransactionXDR({
      source: { publicKey: sourceKp.publicKey(), server },
      batch,
      network,
      memo: opts.memo,
      sdk,
    });
    summary.transactions.push({
      operationCount: batch.length,
      xdr: tx.toXDR(),
    });
  }
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  if (opts.output) await fs.writeFile(resolvePath(opts.output), JSON.stringify(summary, null, 2));
  return 0;
}

async function cmdSubmit(inputPath, opts) {
  const rows = await parsePaymentFile(inputPath);
  const { errors } = await validateRows(rows);
  if (errors.length > 0) {
    process.stderr.write(`Refusing to submit: ${errors.length} validation error(s)\n`);
    return 1;
  }
  const sdk = await import("stellar-sdk");
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret) {
    process.stderr.write("submit requires STELLAR_SECRET_KEY in the environment\n");
    return 1;
  }
  const sourceKp = sdk.Keypair.fromSecret(secret);
  const network = opts.network === "mainnet" ? "mainnet" : "testnet";
  const horizonUrl =
    network === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  const server = new sdk.Horizon.Server(horizonUrl);
  const batchSize = Number(opts.batchSize) > 0 ? Number(opts.batchSize) : DEFAULT_BATCH_SIZE;
  const batches = chunkBatches(rows, batchSize);

  const summary = {
    command: "submit",
    input: inputPath,
    network,
    batchCount: batches.length,
    results: [],
  };

  for (const batch of batches) {
    const tx = await buildTransactionXDR({
      source: { publicKey: sourceKp.publicKey(), server },
      batch,
      network,
      memo: opts.memo,
      sdk,
    });
    tx.sign(sourceKp);
    try {
      const result = await server.submitTransaction(tx);
      summary.results.push({
        operationCount: batch.length,
        hash: result.hash,
        ledger: result.ledger,
      });
    } catch (err) {
      summary.results.push({
        operationCount: batch.length,
        error:
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "submission failed",
      });
    }
  }
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  if (opts.output) await fs.writeFile(resolvePath(opts.output), JSON.stringify(summary, null, 2));
  return summary.results.every((r) => !r.error) ? 0 : 1;
}

// ── Entry point ───────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  if (args.flags.version) {
    process.stdout.write(`${PKG_NAME} ${PKG_VERSION}\n`);
    return 0;
  }
  if (args.flags.help || args.command === null) {
    printUsage();
    return args.command === null ? 0 : 0;
  }

  const input = args.positional[0] ?? args.flags.input;
  if (!input || typeof input !== "string") {
    process.stderr.write(`${args.command}: missing input file path\n`);
    printUsage();
    return 1;
  }

  const opts = {
    network:
      args.flags.network === "mainnet" || args.flags.network === "testnet"
        ? args.flags.network
        : "testnet",
    output: typeof args.flags.output === "string" ? args.flags.output : undefined,
    batchSize: args.flags["batch-size"],
    memo: typeof args.flags.memo === "string" ? args.flags.memo : undefined,
  };

  try {
    switch (args.command) {
      case "validate":
        return await cmdValidate(input);
      case "build":
        return await cmdBuild(input, opts);
      case "submit":
        return await cmdSubmit(input, opts);
      default:
        process.stderr.write(`Unknown command: ${args.command}\n`);
        printUsage();
        return 1;
    }
  } catch (err) {
    process.stderr.write(
      `${args.command} failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return 1;
  }
}

main().then(
  (code) => process.exit(code ?? 0),
  (err) => {
    process.stderr.write(`fatal: ${err?.message ?? err}\n`);
    process.exit(1);
  },
);
