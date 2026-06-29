/**
 * Tests for the keeper's recipient discovery logic (#585).
 *
 * Validates that fetchActiveRecipients-style parsing uses
 * decodeTopicValue + parseVestingEventRecipient rather than brittle
 * string-includes heuristics.
 */
import {
  decodeTopicValue,
  parseVestingEventRecipient,
} from "../lib/stellar/vesting-events";

const RECIPIENT = "GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678901234";

function makeTopics(eventName: string, ...rest: unknown[]): unknown[] {
  return [{ sym: eventName }, ...rest];
}

function discoverRecipientFromEvent(event: {
  type: string;
  topic?: unknown[];
  contractId?: unknown[];
}): string | undefined {
  if (event.type !== "contract") return undefined;
  const topics: unknown[] = Array.isArray(event.topic)
    ? event.topic
    : Array.isArray(event.contractId)
      ? event.contractId
      : [];

  const eventName = decodeTopicValue(topics[0]);
  if (!eventName) return undefined;

  return parseVestingEventRecipient(eventName, topics);
}

describe("keeper recipient discovery", () => {
  describe("VestingDeposited", () => {
    it("extracts recipient from topic index 2", () => {
      const topics = makeTopics("VestingDeposited", "token_addr", RECIPIENT);
      const result = parseVestingEventRecipient("VestingDeposited", topics);
      expect(result).toBe(RECIPIENT);
    });

    it("returns undefined when recipient topic is missing", () => {
      const topics = makeTopics("VestingDeposited", "token_addr");
      const result = parseVestingEventRecipient("VestingDeposited", topics);
      expect(result).toBeUndefined();
    });
  });

  describe("VestingClaimed", () => {
    it("extracts recipient from topic index 1", () => {
      const topics = makeTopics("VestingClaimed", RECIPIENT);
      const result = parseVestingEventRecipient("VestingClaimed", topics);
      expect(result).toBe(RECIPIENT);
    });
  });

  describe("VestingRevoked", () => {
    it("extracts recipient from topic index 1", () => {
      const topics = makeTopics("VestingRevoked", RECIPIENT);
      const result = parseVestingEventRecipient("VestingRevoked", topics);
      expect(result).toBe(RECIPIENT);
    });
  });

  describe("VestingTransferred", () => {
    it("extracts recipient from topic index 1", () => {
      const topics = makeTopics("VestingTransferred", RECIPIENT);
      const result = parseVestingEventRecipient("VestingTransferred", topics);
      expect(result).toBe(RECIPIENT);
    });
  });

  describe("VestingPartiallyRevoked", () => {
    it("extracts recipient from topic index 1", () => {
      const topics = makeTopics("VestingPartiallyRevoked", RECIPIENT);
      const result = parseVestingEventRecipient(
        "VestingPartiallyRevoked",
        topics,
      );
      expect(result).toBe(RECIPIENT);
    });
  });

  describe("unknown event types", () => {
    it("returns undefined for unknown event name", () => {
      const topics = makeTopics("SomeOtherEvent", RECIPIENT);
      const result = parseVestingEventRecipient("SomeOtherEvent", topics);
      expect(result).toBeUndefined();
    });

    it("does NOT match on substring heuristics like includes('vested')", () => {
      // Old brittle code would match "VestingDeposited" via includes("vested")
      // but also match "harvested" — the new code does exact matching
      const result = parseVestingEventRecipient("harvested", [
        { sym: "harvested" },
        RECIPIENT,
      ]);
      expect(result).toBeUndefined();
    });

    it("does NOT match on includes('created') heuristic", () => {
      const result = parseVestingEventRecipient("created", [
        { sym: "created" },
        RECIPIENT,
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe("decoverRecipientFromEvent integration", () => {
    it("handles event with topic array field", () => {
      const event = {
        type: "contract",
        topic: makeTopics("VestingClaimed", RECIPIENT),
      };
      expect(discoverRecipientFromEvent(event)).toBe(RECIPIENT);
    });

    it("handles event with contractId array as fallback", () => {
      const event = {
        type: "contract",
        contractId: makeTopics("VestingRevoked", RECIPIENT) as any,
      };
      expect(discoverRecipientFromEvent(event)).toBe(RECIPIENT);
    });

    it("skips non-contract events", () => {
      const event = {
        type: "diagnostic",
        topic: makeTopics("VestingClaimed", RECIPIENT),
      };
      expect(discoverRecipientFromEvent(event)).toBeUndefined();
    });

    it("skips events with empty topics", () => {
      const event = { type: "contract", topic: [] };
      expect(discoverRecipientFromEvent(event)).toBeUndefined();
    });

    it("deduplication: same recipient from multiple events collected once", () => {
      const events = [
        { type: "contract", topic: makeTopics("VestingDeposited", "tok", RECIPIENT) },
        { type: "contract", topic: makeTopics("VestingClaimed", RECIPIENT) },
        { type: "contract", topic: makeTopics("VestingRevoked", RECIPIENT) },
      ];
      const recipients = new Set<string>();
      for (const ev of events) {
        const r = discoverRecipientFromEvent(ev);
        if (r) recipients.add(r);
      }
      expect(recipients.size).toBe(1);
      expect(recipients.has(RECIPIENT)).toBe(true);
    });
  });

  describe("decodeTopicValue", () => {
    it("decodes sym object to string", () => {
      expect(decodeTopicValue({ sym: "VestingDeposited" })).toBe(
        "VestingDeposited",
      );
    });

    it("passes through plain string", () => {
      expect(decodeTopicValue("VestingClaimed")).toBe("VestingClaimed");
    });

    it("returns undefined for null", () => {
      expect(decodeTopicValue(null)).toBeUndefined();
    });

    it("returns undefined for numeric topic", () => {
      expect(decodeTopicValue(42)).toBeUndefined();
    });
  });
});
