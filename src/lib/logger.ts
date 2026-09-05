type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "cookie",
  "cookies",
  "accesscode",
  "authorization",
  "apikey",
  "api_key",
  "accesstoken",
  "refreshtoken",
  "session",
]);

export function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === "production" ? undefined : data.stack,
    };
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitizedObj[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitizedObj[key] = sanitize(value);
    } else {
      sanitizedObj[key] = value;
    }
  }

  return sanitizedObj;
}

function formatLog(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = meta !== undefined ? sanitize(meta) : undefined;

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(sanitizedMeta !== undefined ? { meta: sanitizedMeta } : {}),
    });
  }

  const metaStr = sanitizedMeta !== undefined ? ` ${JSON.stringify(sanitizedMeta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (process.env.NODE_ENV !== "production" || process.env.LOG_LEVEL === "debug") {
      console.debug(formatLog("debug", message, meta));
    }
  },

  info(message: string, meta?: unknown) {
    console.info(formatLog("info", message, meta));
  },

  warn(message: string, meta?: unknown) {
    console.warn(formatLog("warn", message, meta));
  },

  error(message: string, meta?: unknown) {
    console.error(formatLog("error", message, meta));
  },
};
