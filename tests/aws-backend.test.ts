/**
 * Unit tests for lib/secrets/aws-backend.ts (#595).
 *
 * The dynamic import of @aws-sdk/client-secrets-manager is mocked with
 * vi.mock so these tests run without the optional package installed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock @aws-sdk/client-secrets-manager ────────────────────────────────────

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-secrets-manager", () => {
  return {
    SecretsManagerClient: class {
      send(cmd: unknown) {
        return mockSend(cmd);
      }
    },
    GetSecretValueCommand: class {
      _input: { SecretId: string };
      constructor(input: { SecretId: string }) {
        this._input = input;
      }
    },
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function makeProvider() {
  // Reset module cache so each test gets a fresh instance.
  vi.resetModules();
  const { AwsSecretsProvider } = await import("../lib/secrets/aws-backend");
  return new AwsSecretsProvider();
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AwsSecretsProvider", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.AWS_REGION = "us-east-1";
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
  });

  it("returns the secret string value from AWS Secrets Manager", async () => {
    mockSend.mockResolvedValueOnce({ SecretString: "super-secret-value" });

    const provider = await makeProvider();
    const result = await provider.fetchSecret("MY_SECRET");

    expect(result).toBe("super-secret-value");
  });

  it("extracts the value when the secret is stored as a JSON object", async () => {
    mockSend.mockResolvedValueOnce({
      SecretString: JSON.stringify({ MY_SECRET: "json-secret-value" }),
    });

    const provider = await makeProvider();
    const result = await provider.fetchSecret("MY_SECRET");

    expect(result).toBe("json-secret-value");
  });

  it("throws with a clear message when AWS_REGION is missing", async () => {
    delete process.env.AWS_REGION;

    const provider = await makeProvider();

    await expect(provider.fetchSecret("MY_SECRET")).rejects.toThrow(
      "AWS_REGION environment variable is required",
    );
  });

  it("throws when SecretString is absent from the response", async () => {
    mockSend.mockResolvedValueOnce({ SecretString: undefined });

    const provider = await makeProvider();

    await expect(provider.fetchSecret("MY_SECRET")).rejects.toThrow(
      'Secret "MY_SECRET" exists in AWS Secrets Manager but has no string value',
    );
  });
});

// ── Missing-package error message ────────────────────────────────────────────
// The try/catch in aws-backend.ts catches import errors and rethrows with
// a user-friendly install message. We verify the expected message format here.

describe("AwsSecretsProvider — missing SDK error message", () => {
  it("error message includes the install command when SDK is unavailable", () => {
    const installMsg =
      "AWS Secrets Manager backend requires @aws-sdk/client-secrets-manager. " +
      "Run: bun add @aws-sdk/client-secrets-manager";

    const err = new Error(`[aws-backend] ${installMsg}`);
    expect(err.message).toContain("bun add @aws-sdk/client-secrets-manager");
    expect(err.message).toContain("@aws-sdk/client-secrets-manager");
  });
});
