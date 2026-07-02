/**
 * CLI argv-parser tests (#362).
 *
 * The CLI subcommands themselves shell out to lib/stellar/* which is
 * already covered by parser/validator/batcher tests; what this file
 * pins is the new `parseArgs` contract since it's the surface the
 * README documents.
 */

import { describe, expect, test } from 'vitest';
import { parseArgs, run } from '../cli/index.js';

describe('CLI argv parser', () => {
  test('returns help=true when invoked with no args', () => {
    expect(parseArgs([])).toMatchObject({ help: true });
  });

  test('recognises every documented command', () => {
    for (const cmd of ['validate', 'build', 'submit', 'help']) {
      expect(parseArgs([cmd]).command).toBe(cmd);
    }
  });

  test('parses --input / --network / --output / --max-ops', () => {
    const a = parseArgs([
      'build',
      '--input', 'foo.json',
      '--network', 'mainnet',
      '--output', 'out.json',
      '--max-ops', '50',
    ]);
    expect(a).toMatchObject({
      command: 'build',
      input: 'foo.json',
      network: 'mainnet',
      output: 'out.json',
      maxOps: 50,
    });
  });

  test('defaults to testnet + maxOps=100 when omitted', () => {
    const a = parseArgs(['validate', '--input', 'foo.json']);
    expect(a.network).toBe('testnet');
    expect(a.maxOps).toBe(100);
  });

  test('rejects an unknown --network value', () => {
    expect(() => parseArgs(['build', '--input', 'x', '--network', 'futurenet'])).toThrow(
      /must be 'testnet' or 'mainnet'/,
    );
  });

  test('rejects a non-positive --max-ops', () => {
    expect(() => parseArgs(['build', '--input', 'x', '--max-ops', '0'])).toThrow(
      /positive integer/,
    );
  });

  test('rejects unknown flags so a typo is loud, not silent', () => {
    expect(() => parseArgs(['build', '--inpot', 'x'])).toThrow(/Unknown argument/);
  });
});

describe('CLI run() entry point', () => {
  test('run([]) exits with code 0 and prints help', async () => {
    // Capture stdout for the help banner.
    const writes: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = ((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    try {
      const code = await run([]);
      expect(code).toBe(0);
      expect(writes.join('')).toMatch(/stellar-batch-pay/);
    } finally {
      process.stdout.write = origWrite;
    }
  });

  test('run() with an unknown command exits 2', async () => {
    const origErr = process.stderr.write.bind(process.stderr);
    (process.stderr.write as unknown) = (() => true);
    try {
      const code = await run(['nope']);
      expect(code).toBe(2);
    } finally {
      process.stderr.write = origErr;
    }
  });

  test('run() with submit exits 2 and prints NOT_IMPLEMENTED', async () => {
    const origErr = process.stderr.write.bind(process.stderr);
    const writes: string[] = [];
    (process.stderr.write as unknown) = ((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    
    const origEnv = process.env.STELLAR_SECRET_KEY;
    process.env.STELLAR_SECRET_KEY = 'S123';
    
    try {
      const code = await run(['submit', '--input', 'examples/payments.json']);
      expect(code).toBe(2);
      expect(writes.join('')).toMatch(/NOT_IMPLEMENTED:/);
    } finally {
      process.stderr.write = origErr;
      process.env.STELLAR_SECRET_KEY = origEnv;
    }
  });
});
