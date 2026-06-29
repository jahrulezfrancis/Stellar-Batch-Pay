export interface LogContext {
  requestId?: string | null;
  jobId?: string | null;
  publicKey?: string | null;
  network?: string | null;
  [key: string]: any;
}

export function truncatePublicKey(pk: string | null | undefined): string | undefined {
  if (!pk) return undefined;
  if (pk.length <= 12) return pk;
  return `${pk.slice(0, 6)}...${pk.slice(-6)}`;
}

function formatContext(ctx: LogContext): Record<string, any> {
  const formatted: Record<string, any> = { ...ctx };
  if (formatted.publicKey && typeof formatted.publicKey === "string") {
    formatted.publicKey = truncatePublicKey(formatted.publicKey);
  }
  return formatted;
}

export const logger = {
  info(ctx: LogContext, msg: string) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        ...formatContext(ctx),
        msg,
      })
    );
  },
  error(ctx: LogContext, msg: string, err?: any) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        ...formatContext(ctx),
        msg,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      })
    );
  },
  warn(ctx: LogContext, msg: string) {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        ...formatContext(ctx),
        msg,
      })
    );
  },
  debug(ctx: LogContext, msg: string) {
    console.debug(
      JSON.stringify({
        level: "debug",
        timestamp: new Date().toISOString(),
        ...formatContext(ctx),
        msg,
      })
    );
  },
};
