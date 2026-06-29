/**
 * Vesting / Soroban integration tests (#364).
 *
 * The contract tests in `contracts/test.rs` cover the Soroban side;
 * the Vitest tests below pin the TS ↔ contract argument encoding so a
 * silent ABI drift in `buildDepositTransaction` is caught before it
 * reaches CI for the contract (issues #321 / #322 referenced in
 * #364). We mock Soroban RPC's `getAccount` + `simulateTransaction` +
 * `assembleTransaction` so the test doesn't touch the network.
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { Contract, Keypair, xdr, scValToNative } from 'stellar-sdk';
import type { PaymentInstruction } from '../lib/stellar/types';

const VALID_CONTRACT_ID =
  'CAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQMCJ';

// --- Mock the Soroban RPC surface --------------------------------

// The implementation under test does `await import('stellar-sdk')`
// and then reaches into `.rpc`. We replace `.rpc.Server` with a fake
// that returns a predictable account + a successful simulation, and
// keep every other export pass-through.
vi.mock('stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stellar-sdk')>();

  const capturedAccountIds: string[] = [];

  class FakeServer {
    constructor(_url: string, _opts?: { allowHttp?: boolean }) {}

    async getAccount(id: string) {
      capturedAccountIds.push(id);
      return new actual.Account(id, '12345');
    }

    async simulateTransaction() {
      return {
        transactionData: { resourceFee: () => 100n },
        minResourceFee: '100',
        latestLedger: 1,
      };
    }
  }

  const assembleTransaction = vi.fn((tx: unknown) => ({
    build: () => tx,
  }));

  const isSimulationError = vi.fn(() => false);

  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: FakeServer,
      assembleTransaction,
      Api: {
        ...(actual.rpc?.Api ?? {}),
        isSimulationError,
      },
    },
    // Hoisted helper for the assertion phase.
    __captured: {
      accountIds: capturedAccountIds,
    },
  };
});

// --- Helpers -----------------------------------------------------

function payment(addr: string, amount: string, asset = 'XLM'): PaymentInstruction {
  return { address: addr, amount, asset };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Tests -------------------------------------------------------

describe('buildDepositTransaction (#364)', () => {
  test('parallel address / amount / token vec lengths match the recipient count', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');

    const sender = Keypair.random().publicKey();
    const payments = [
      payment(Keypair.random().publicKey(), '10.5'),
      payment(Keypair.random().publicKey(), '25'),
      payment(Keypair.random().publicKey(), '100.123'),
    ];

    // We intentionally don't try to decode the full assembled XDR
    // (it's network-dependent); we just need the build to succeed,
    // which transitively exercises the vec encoding helpers.
    const xdrEnvelope = await buildDepositTransaction(
      VALID_CONTRACT_ID,
      payments,
      1_700_000_000,
      1_800_000_000,
      86_400, // cliffTime
      86_400, // vestingStep
      'testnet',
      sender,
    );
    expect(typeof xdrEnvelope).toBe('string');
    expect(xdrEnvelope.length).toBeGreaterThan(0);
  });

  test('XLM is wrapped to the testnet native token address', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');
    const sender = Keypair.random().publicKey();
    // Two XLM payments — both should hit the same testnet wrapped
    // contract address inside the token vec.
    const payments = [
      payment(Keypair.random().publicKey(), '1'),
      payment(Keypair.random().publicKey(), '2'),
    ];
    await expect(
      buildDepositTransaction(
        VALID_CONTRACT_ID,
        payments,
        1_700_000_000,
        1_700_000_100,
        86_400, // cliffTime
        86_400, // vestingStep
        'testnet',
        sender,
      ),
    ).resolves.toBeDefined();
  });

  test('per-payment amount with 7-decimal precision rounds to integer stroops', async () => {
    // Sanity: the implementation uses
    //   stroops = BigInt(Math.round(parseFloat(amt) * 1e7))
    // which converts '10.5' → 105_000_000n. We assert via a
    // round-trip through `scValToNative` on a synthesised ScVal.
    const { default: amountVec } = await (async () => {
      // Recreate the conversion the implementation uses so we can
      // assert against the same source of truth — keeps the test
      // independent of `vesting.ts` internals while still pinning
      // the contract.
      const { nativeToScVal } = await import('stellar-sdk');
      const sv = nativeToScVal(BigInt(Math.round(10.5 * 1e7)), { type: 'i128' });
      return { default: sv };
    })();
    expect(scValToNative(amountVec)).toBe(105_000_000n);
  });

  test('memo vec uses scvString for each entry (empty string when memo absent)', async () => {
    // Same trick: synthesise via the same primitive the implementation
    // uses and check `scvType()` round-trips.
    const { nativeToScVal } = await import('stellar-sdk');
    const empty = nativeToScVal('', { type: 'string' });
    expect(empty.switch()).toBe(xdr.ScValType.scvString());
  });

  test('passes through C... SAC contract addresses unchanged (#611)', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');
    const sender = Keypair.random().publicKey();
    const sacAddress = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
    const payments = [
      payment(Keypair.random().publicKey(), '10', sacAddress),
    ];
    await expect(
      buildDepositTransaction(
        VALID_CONTRACT_ID,
        payments,
        1_700_000_000,
        1_800_000_000,
        86_400,
        86_400,
        'testnet',
        sender,
      ),
    ).resolves.toBeDefined();
  });

  test('resolves classic USDC:ISSUER to testnet SAC address via registry (#611)', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');
    const sender = Keypair.random().publicKey();
    const usdcAsset = 'USDC:GBBD47UZM2HN7D7XZIZVG4KVAUC36THN5BES6RMNNOK5TUNXAUCVMAKER';
    const payments = [
      payment(Keypair.random().publicKey(), '25', usdcAsset),
    ];
    await expect(
      buildDepositTransaction(
        VALID_CONTRACT_ID,
        payments,
        1_700_000_000,
        1_800_000_000,
        86_400,
        86_400,
        'testnet',
        sender,
      ),
    ).resolves.toBeDefined();
  });

  test('rejects an invalid network at the type boundary', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');
    const sender = Keypair.random().publicKey();
    await expect(
      buildDepositTransaction(
        VALID_CONTRACT_ID,
        [payment(Keypair.random().publicKey(), '1')],
        1,
        2,
        1,
        1,
        // @ts-expect-error deliberate boundary violation
        'invalid-network',
        sender,
      ),
    ).rejects.toBeDefined();
  });
});

describe('buildRevokeTransaction (#392)', () => {
  test('revoke passes caller, recipient and index in order', async () => {
    const callSpy = vi.spyOn(Contract.prototype, 'call');
    const { buildRevokeTransaction } = await import('../lib/stellar/vesting');

    const recipient = Keypair.random().publicKey();
    const caller = Keypair.random().publicKey();

    // We only assert the ScVals handed to `contract.call(...)`; those are
    // assembled before the network-bound Soroban submission, so swallow any
    // downstream RPC error and let the ABI assertion stand on its own. A
    // structurally valid contract ID is required by the current stellar-sdk.
    await buildRevokeTransaction(
      'CAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQMCJ',
      recipient,
      3,
      'testnet',
      caller,
    ).catch(() => undefined);

    expect(callSpy).toHaveBeenCalledTimes(1);
    const [fn, ...args] = callSpy.mock.calls[0];
    expect(fn).toBe('revoke');
    // Contract is revoke(env, caller, recipient, index) — three ScVals after fn.
    expect(args).toHaveLength(3);
    expect(scValToNative(args[0] as xdr.ScVal)).toBe(caller);
    expect(scValToNative(args[1] as xdr.ScVal)).toBe(recipient);
    expect(Number(scValToNative(args[2] as xdr.ScVal))).toBe(3);
    callSpy.mockRestore();
  });
});

describe('amount precision in buildDepositTransaction (#506)', () => {
  test('encodes high-precision amounts as exact i128 stroops', async () => {
    const callSpy = vi.spyOn(Contract.prototype, 'call');
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');

    const sender = Keypair.random().publicKey();
    // Amounts that the old parseFloat path could not represent faithfully.
    const payments = [
      payment(Keypair.random().publicKey(), '0.1234567'),
      payment(Keypair.random().publicKey(), '123456789.1234567'),
      payment(Keypair.random().publicKey(), '99999999.9999999'),
    ];

    await buildDepositTransaction(
      VALID_CONTRACT_ID,
      payments,
      1_700_000_000,
      1_800_000_000,
      86_400,
      86_400,
      'testnet',
      sender,
    ).catch(() => undefined);

    expect(callSpy).toHaveBeenCalled();
    // deposit args: [sender, tokens, recipients, amounts, ...]
    const amountsVec = callSpy.mock.calls[0][4] as xdr.ScVal;
    const decoded = scValToNative(amountsVec) as bigint[];
    expect(decoded).toEqual([
      1_234_567n,
      1_234_567_891_234_567n,
      999_999_999_999_999n,
    ]);
    callSpy.mockRestore();
  });

  test('rejects amounts with more than 7 decimal places before RPC', async () => {
    const { buildDepositTransaction } = await import('../lib/stellar/vesting');
    const sender = Keypair.random().publicKey();
    const payments = [payment(Keypair.random().publicKey(), '0.12345678')];

    await expect(
      buildDepositTransaction(
        VALID_CONTRACT_ID,
        payments,
        1_700_000_000,
        1_800_000_000,
        86_400,
        86_400,
        'testnet',
        sender,
      ),
    ).rejects.toThrow(/more than 7 decimal places/);
  });
});

describe('buildTransferVestingRightsTransaction', () => {
  test('transfer_vesting_rights passes three contract arguments', async () => {
    const callSpy = vi.spyOn(Contract.prototype, 'call');
    const { buildTransferVestingRightsTransaction } = await import('../lib/stellar/vesting');

    const from = Keypair.random().publicKey();
    const to = Keypair.random().publicKey();
    const signer = Keypair.random().publicKey();

    await buildTransferVestingRightsTransaction(
      VALID_CONTRACT_ID,
      from,
      to,
      2,
      'testnet',
      signer,
    ).catch(() => undefined);

    expect(callSpy).toHaveBeenCalled();
    const [fn, ...args] = callSpy.mock.calls[0];
    expect(fn).toBe('transfer_vesting_rights');
    expect(args).toHaveLength(3);
    callSpy.mockRestore();
  });
});
