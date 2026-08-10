type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  sessionId?: string;
  gameId?: string;
  userId?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

function sanitize(context: LogContext): LogContext {
  const blocked = new Set([
    "password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "cookie",
    "cookies",
    "apiKey",
    "serviceRoleKey",
  ]);
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (blocked.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

export const logger = {
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
};

export function createRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
