import { messages, type Messages } from "@/messages/en";

type MessagePath<K extends string> =
  K extends `${infer P1}.${infer P2}`
    ? P1 extends keyof Messages
      ? P2 extends keyof Messages[P1]
        ? Messages[P1][P2]
        : string
      : string
    : string;

export function t<K extends string>(path: K, params?: Record<string, string | number>): string {
  const [ns, key] = path.split(".") as [keyof Messages, string];
  const nsMessages = messages[ns];
  if (!nsMessages) return path;

  let value: unknown = (nsMessages as Record<string, unknown>)[key];

  if (typeof value !== "string") return path;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }

  return value;
}
