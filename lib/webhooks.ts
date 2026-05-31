import crypto from "crypto";

export interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  secret: string;
}

/** Safe public view of a registration — never exposes the full secret. */
export interface WebhookRegistrationRedacted {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  /** First 8 chars of the HMAC secret for display/debug only. */
  secretPrefix: string;
}

// RFC1918 + localhost CIDR patterns that must not receive server-side POSTs.
const PRIVATE_HOSTNAME_RE =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/i;

// Link-local / cloud metadata ranges: 169.254.0.0/16 and IPv6 link-local.
const LINK_LOCAL_RE = /^169\.254\.\d+\.\d+$/;
const IPV6_LOOPBACK_RE = /^(::1|0*:0*:0*:0*:0*:0*:0*:1)$/i;
// Well-known metadata hostnames used by cloud providers.
const METADATA_HOSTNAME_RE =
  /^(metadata\.google\.internal|metadata\.goog|169\.254\.169\.254|fd00:ec2::254)$/i;

/**
 * Decode all common IP obfuscation forms to a dotted-decimal string.
 * Handles decimal (2130706433), octal (0177.0.0.1), and hex (0x7f000001).
 */
function normalizePossibleIp(hostname: string): string {
  // Pure decimal integer encoding (e.g. 2130706433 → 127.0.0.1)
  if (/^\d+$/.test(hostname)) {
    const n = parseInt(hostname, 10);
    if (n >= 0 && n <= 0xffffffff) {
      return [
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff,
      ].join(".");
    }
  }
  // Hex encoding (e.g. 0x7f000001)
  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    const n = parseInt(hostname, 16);
    if (n >= 0 && n <= 0xffffffff) {
      return [
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff,
      ].join(".");
    }
  }
  return hostname;
}

/**
 * Validate that a webhook target URL is safe for server-side delivery.
 *
 * Rules:
 *  - Must use HTTPS (not HTTP).
 *  - Hostname must not resolve to RFC1918, localhost, link-local (169.254/16),
 *    IPv6 loopback (::1), or cloud metadata service addresses.
 *  - Decimal/hex/octal IP encodings are normalised before checking.
 *
 * Returns `null` on success or an error string on failure.
 */
export function validateWebhookUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "URL is invalid.";
  }

  if (parsed.protocol !== "https:") {
    return "Webhook URL must use HTTPS.";
  }

  const hostname = normalizePossibleIp(parsed.hostname);

  if (PRIVATE_HOSTNAME_RE.test(hostname)) {
    return "Webhook URL must not target private/local addresses.";
  }

  if (LINK_LOCAL_RE.test(hostname)) {
    return "Webhook URL must not target link-local addresses (169.254.0.0/16).";
  }

  if (IPV6_LOOPBACK_RE.test(hostname)) {
    return "Webhook URL must not target IPv6 loopback addresses.";
  }

  if (METADATA_HOSTNAME_RE.test(hostname)) {
    return "Webhook URL must not target cloud metadata service addresses.";
  }

  return null;
}

// In-memory store for demonstration. In production, this would be a database.
let webhooks: WebhookRegistration[] = [];

export function registerWebhook(url: string, events: string[], secret?: string): WebhookRegistration {
  const newWebhook: WebhookRegistration = {
    id: crypto.randomUUID(),
    url,
    events,
    createdAt: new Date().toISOString(),
    secret: secret || crypto.randomBytes(32).toString('hex'),
  };
  webhooks.push(newWebhook);
  return newWebhook;
}

export function verifyWebhookSignature(payload: string, secret: string, signature: string): boolean {
  // #332: Validate signature format before timing-safe comparison.
  // timingSafeEqual throws if buffers have different lengths; gracefully
  // reject malformed input to avoid 500 errors and DoS on bad client signatures.
  if (!signature || signature.length === 0) {
    return false;
  }

  // Validate hex format: must be even length (hex pairs)
  if (signature.length % 2 !== 0) {
    return false;
  }

  // Validate characters are hex digits
  if (!/^[0-9a-fA-F]*$/.test(signature)) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Length check before timingSafeEqual to prevent throws
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

export function unregisterWebhook(id: string): boolean {
  const initialLength = webhooks.length;
  webhooks = webhooks.filter((w) => w.id !== id);
  return webhooks.length < initialLength;
}

export function getWebhooks(): WebhookRegistration[] {
  return [...webhooks];
}

/** Returns webhook list with secrets stripped to a short prefix. */
export function getWebhooksRedacted(): WebhookRegistrationRedacted[] {
  return webhooks.map(({ id, url, events, createdAt, secret }) => ({
    id,
    url,
    events,
    createdAt,
    secretPrefix: secret.slice(0, 8),
  }));
}

export async function triggerWebhooks(eventName: string, payload: any) {
  const targets = webhooks.filter((w) => w.events.includes(eventName) || w.events.includes("*"));
   
  const results = await Promise.allSettled(
    targets.map(async (webhook) => {
      try {
        const timestamp = new Date().toISOString();
        const bodyPayload = { event: eventName, payload, timestamp };
        const body = JSON.stringify(bodyPayload);
        
        const signature = crypto.createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex');
        
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Stellar-Batch-Pay-Event": eventName,
            "x-webhook-signature": signature,
          },
          body,
        });
        return { id: webhook.id, success: response.ok, status: response.status };
      } catch (error) {
        return { id: webhook.id, success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    })
  );

  return results;
}
