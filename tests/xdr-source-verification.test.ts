/**
 * Unit tests for pre-signed XDR source-account verification (#504).
 * Covers both standard transaction envelopes and fee-bump envelopes.
 */

import { describe, test, expect } from "vitest";
import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { getXdrSourceAccount, findSourceMismatch } from "../lib/stellar/xdr-source";

function buildSignedXdr(
  sourceKeypair: Keypair,
  network: "testnet" | "mainnet" = "testnet",
): string {
  const account = new Account(sourceKeypair.publicKey(), "0");
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
  })
    .addOperation(
      Operation.payment({
        destination: Keypair.random().publicKey(),
        asset: Asset.native(),
        amount: "1",
      }),
    )
    .setTimeout(300)
    .build();
  tx.sign(sourceKeypair);
  return tx.toEnvelope().toXDR("base64");
}

function buildFeeBumpXdr(
  innerSource: Keypair,
  feeSource: Keypair,
  network: "testnet" | "mainnet" = "testnet",
): string {
  const passphrase = network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;
  const account = new Account(innerSource.publicKey(), "0");
  const innerTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: Keypair.random().publicKey(),
        asset: Asset.native(),
        amount: "1",
      }),
    )
    .setTimeout(300)
    .build();
  innerTx.sign(innerSource);

  const feeBump = TransactionBuilder.buildFeeBumpTransaction(
    feeSource,
    (Number(BASE_FEE) * 2).toString(),
    innerTx,
    passphrase,
  );
  feeBump.sign(feeSource);
  return feeBump.toEnvelope().toXDR("base64");
}

describe("getXdrSourceAccount (#504)", () => {
  test("returns the source of a standard transaction envelope", () => {
    const wallet = Keypair.random();
    const xdr = buildSignedXdr(wallet);
    expect(getXdrSourceAccount(xdr, "testnet")).toBe(wallet.publicKey());
  });

  test("returns the INNER source of a fee-bump envelope, not the fee source", () => {
    const innerSource = Keypair.random();
    const feeSource = Keypair.random();
    const xdr = buildFeeBumpXdr(innerSource, feeSource);
    expect(getXdrSourceAccount(xdr, "testnet")).toBe(innerSource.publicKey());
    expect(getXdrSourceAccount(xdr, "testnet")).not.toBe(feeSource.publicKey());
  });

  test("returns undefined for an unparseable envelope", () => {
    expect(getXdrSourceAccount("not-a-real-xdr", "testnet")).toBeUndefined();
  });
});

describe("findSourceMismatch (#504)", () => {
  test("returns null when every source matches the expected key", () => {
    const wallet = Keypair.random();
    const xdrs = [buildSignedXdr(wallet), buildSignedXdr(wallet)];
    expect(findSourceMismatch(xdrs, wallet.publicKey(), "testnet")).toBeNull();
  });

  test("flags a standard envelope signed by a different wallet", () => {
    const owner = Keypair.random();
    const attacker = Keypair.random();
    const xdrs = [buildSignedXdr(owner), buildSignedXdr(attacker)];
    const mismatch = findSourceMismatch(xdrs, owner.publicKey(), "testnet");
    expect(mismatch).toEqual({ index: 1, source: attacker.publicKey() });
  });

  test("flags a fee-bump whose inner source is a different wallet", () => {
    const owner = Keypair.random();
    const attacker = Keypair.random();
    // Attacker signs the payment; owner only pays the fee — must still be rejected.
    const xdr = buildFeeBumpXdr(attacker, owner);
    const mismatch = findSourceMismatch([xdr], owner.publicKey(), "testnet");
    expect(mismatch).toEqual({ index: 0, source: attacker.publicKey() });
  });

  test("accepts a fee-bump whose inner source matches the expected key", () => {
    const owner = Keypair.random();
    const feeSource = Keypair.random();
    const xdr = buildFeeBumpXdr(owner, feeSource);
    expect(findSourceMismatch([xdr], owner.publicKey(), "testnet")).toBeNull();
  });
});
