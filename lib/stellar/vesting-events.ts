import { scValToNative, xdr } from "stellar-sdk";

export interface VestingClaimedEventPayload {
  amount: string;
  token: string;
  memo: string;
}

export interface VestingDepositedEventPayload {
  amount: string;
  startTime: number;
  endTime: number;
  cliffTime: number;
  vestingStep: number;
  token: string;
  memo: string;
}

export interface VestingRevokedEventPayload {
  revokedAmount: string;
  pendingVested: string;
  token: string;
  memo: string;
  batchId: number;
}

export interface VestingPartiallyRevokedEventPayload {
  amountRevoked: string;
  remainingTotal: string;
  token: string;
  memo: string;
}

export interface VestingTransferredEventPayload {
  newAddress: string;
  oldIndex: number;
}

export interface FeeCollectedEventPayload {
  totalFee: string;
  feeAsset: string;
  treasury: string;
}

function decodeScValValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(decodeScValValue);
  }

  const obj = value as Record<string, unknown>;
  if ("i128" in obj) {
    const parts = obj.i128 as { hi?: number | string; lo?: number | string };
    const hi = BigInt(parts.hi ?? 0);
    const lo = BigInt(parts.lo ?? 0);
    return (hi << 64n) + lo;
  }
  if ("u64" in obj) {
    const raw = obj.u64;
    // Snapshot format stores u64 as a plain number; on-chain XDR uses { hi, lo }
    if (typeof raw === "number" || typeof raw === "string") {
      return Number(raw);
    }
    const parts = raw as { hi?: number | string; lo?: number | string };
    const hi = BigInt(parts.hi ?? 0);
    const lo = BigInt(parts.lo ?? 0);
    return Number((hi << 64n) + lo);
  }
  if ("u32" in obj) {
    return Number(obj.u32);
  }
  if ("address" in obj) {
    return String(obj.address);
  }
  if ("string" in obj) {
    return String(obj.string);
  }
  if ("symbol" in obj) {
    return String(obj.symbol);
  }
  if ("vec" in obj && Array.isArray(obj.vec)) {
    return obj.vec.map(decodeScValValue);
  }

  return value;
}

export function normalizeEventPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.map(decodeScValValue);
  }
  if (payload && typeof payload === "object") {
    const decoded = decodeScValValue(payload);
    if (Array.isArray(decoded)) {
      return decoded;
    }
  }
  throw new Error("Invalid event payload format.");
}

function toAmountString(value: unknown): string {
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error("Invalid amount in event payload.");
}

function toU64(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  throw new Error(`Invalid ${field} in event payload.`);
}

function toTokenAddress(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error("Missing token address in event payload.");
}

function toAddress(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error(`Missing ${field} in event payload.`);
}

function toMemo(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseVestingClaimedPayload(payload: unknown): VestingClaimedEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 2) {
    throw new Error("Invalid VestingClaimed payload format.");
  }

  return {
    amount: toAmountString(fields[0]),
    token: toTokenAddress(fields[1]),
    memo: fields.length > 2 ? toMemo(fields[2]) : "",
  };
}

export function parseVestingDeposited(payload: unknown): VestingDepositedEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 6) {
    throw new Error("Invalid VestingDeposited payload format.");
  }

  const tokenIndex = fields.length >= 7 ? 5 : 4;
  const memoIndex = fields.length >= 7 ? 6 : 5;

  return {
    amount: toAmountString(fields[0]),
    startTime: toU64(fields[1], "start_time"),
    endTime: toU64(fields[2], "end_time"),
    cliffTime: toU64(fields[3], "cliff_time"),
    vestingStep: fields.length >= 7 ? toU64(fields[4], "vesting_step") : 0,
    token: toTokenAddress(fields[tokenIndex]),
    memo: fields.length > memoIndex ? toMemo(fields[memoIndex]) : "",
  };
}

export function parseVestingRevoked(payload: unknown): VestingRevokedEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 3) {
    throw new Error("Invalid VestingRevoked payload format.");
  }

  return {
    revokedAmount: toAmountString(fields[0]),
    pendingVested: toAmountString(fields[1]),
    token: toTokenAddress(fields[2]),
    memo: fields.length > 3 ? toMemo(fields[3]) : "",
    batchId: fields.length > 4 ? Number(fields[4]) : 0,
  };
}

export function parseVestingPartiallyRevoked(
  payload: unknown,
): VestingPartiallyRevokedEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 3) {
    throw new Error("Invalid VestingPartiallyRevoked payload format.");
  }

  return {
    amountRevoked: toAmountString(fields[0]),
    remainingTotal: toAmountString(fields[1]),
    token: toTokenAddress(fields[2]),
    memo: fields.length > 3 ? toMemo(fields[3]) : "",
  };
}

export function parseVestingTransferred(payload: unknown): VestingTransferredEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 2) {
    throw new Error("Invalid VestingTransferred payload format.");
  }

  return {
    newAddress: toAddress(fields[0], "new_address"),
    oldIndex: toU64(fields[1], "old_index"),
  };
}

export function parseFeeCollected(payload: unknown): FeeCollectedEventPayload {
  const fields = normalizeEventPayload(payload);
  if (fields.length < 3) {
    throw new Error("Invalid FeeCollected payload format.");
  }

  return {
    totalFee: toAmountString(fields[0]),
    feeAsset: toTokenAddress(fields[1]),
    treasury: toAddress(fields[2], "treasury"),
  };
}

export function decodeTopicValue(topic: unknown): string | undefined {
  if (typeof topic === "string") {
    return topic;
  }
  const decoded = decodeScValValue(topic);
  if (typeof decoded === "string") {
    return decoded;
  }
  if (decoded && typeof decoded === "object" && "sym" in (decoded as object)) {
    return String((decoded as { sym: string }).sym);
  }
  return undefined;
}

export function parseVestingEventRecipient(
  eventName: string,
  topics: unknown[],
): string | undefined {
  const normalizedTopics = topics.map(decodeTopicValue);

  switch (eventName) {
    case "VestingDeposited":
      return normalizedTopics[2];
    case "VestingClaimed":
    case "VestingRevoked":
    case "VestingPartiallyRevoked":
    case "VestingTransferred":
      return normalizedTopics[1];
    default:
      return undefined;
  }
}

export function scValFromXdrBase64(xdrBase64: string): unknown {
  const scVal = xdr.ScVal.fromXDR(xdrBase64, "base64");
  return scValToNative(scVal);
}
