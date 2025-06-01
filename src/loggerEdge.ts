type LogLevel = "info" | "error" | "warn" | "debug";

type LogItem = {
  userId?: string;
  [key: string]: any;
};

interface Logger {
  debug: (message: string, data?: LogItem) => void;
  info: (message: string, data?: LogItem) => void;
  error: (message: string, data?: LogItem) => void;
  warn: (message: string, data?: LogItem) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

// Store timers
const timers: Record<string, number> = {};

// Datadog config
const DATADOG_API_KEY = process.env.DATADOG_API_KEY!;
const DATADOG_URL = `https://http-intake.logs.datadoghq.com/v1/input/${DATADOG_API_KEY}`;

const sendToDatadog = async (
  level: LogLevel,
  message: string,
  data?: LogItem,
) => {
  if (!DATADOG_API_KEY) return;

  const payload = {
    message,
    level,
    service: "backend",
    ddtags: `env:${process.env.NODE_ENV ?? "development"},source:custom-node`,
    user: data?.userId ?? "unknown",
    ...data,
  };

  try {
    await fetch(DATADOG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": DATADOG_API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[Logger] Failed to send log to Datadog:", err);
  }
};

const logger: Logger = {
  debug: (message, data) => {
    console.debug(`[DEBUG] ${message}`, data ?? {});
    if (process.env.NODE_ENV === "production")
      sendToDatadog("debug", message, data);
  },
  info: (message, data) => {
    console.info(`[INFO] ${message}`, data ?? {});
    if (process.env.NODE_ENV === "production")
      sendToDatadog("info", message, data);
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data ?? {});
    if (process.env.NODE_ENV === "production")
      sendToDatadog("warn", message, data);
  },
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data ?? {});
    if (process.env.NODE_ENV === "production")
      sendToDatadog("error", message, data);
  },
  time: label => {
    timers[label] = performance.now();
    console.time(label);
  },
  timeEnd: label => {
    const start = timers[label];
    if (start !== undefined) {
      const duration = performance.now() - start;
      const durationInSeconds = duration / 1000;
      logger.info(`Timer '${label}': ${durationInSeconds.toFixed(2)}s`);
      delete timers[label];
    } else {
      logger.warn(`Timer '${label}' does not exist`);
    }
    console.timeEnd(label);
  },
};

export default logger;
