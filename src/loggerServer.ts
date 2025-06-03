/* eslint-disable no-unused-vars */
import { createLogger, format, transports } from "winston";

type LogItem = {
  userId: string;
} & Record<string, any>;

interface Logger {
  debug: (message: string, data?: LogItem) => void;
  info: (message: string, data?: LogItem) => void;
  error: (message: string, data?: LogItem) => void;
  warn: (message: string, data?: LogItem) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

const httpTransportOptions = {
  host: process.env.DATADOG_HOST,
  path: process.env.DATADOG_PATH,
  ssl: true,
};

const _logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.json(),
  transports: [new transports.Http(httpTransportOptions)],
});

// Store timers
const timers: Record<string, number> = {};

const logger: () => Logger = () => {
  const log = (
    level: "info" | "error" | "warn" | "debug",
    message: string,
    data?: LogItem,
  ) => {
    try {
      const env = process.env.NODE_ENV;
      if (env === "development") {
        return;
      }
      _logger.log(level, message, {
        data,
        env,
      });
    } catch (error: any) {
      console.log("Error logging", error);
    }

    switch (level) {
      case "info":
        console.info(message, data);
        break;
      case "error":
        console.error(message, data);
        break;
      case "warn":
        console.warn(message, data);
        break;
      case "debug":
        console.debug(message, data);
        break;
      default:
        console.log(message, data);
        break;
    }
  };

  return {
    debug: (message: string, data?: LogItem) => log("debug", message, data),
    info: (message: string, data?: LogItem) => log("info", message, data),
    error: (message: string, data?: LogItem) => log("error", message, data),
    warn: (message: string, data?: LogItem) => log("warn", message, data),
    time: (label: string) => {
      timers[label] = performance.now();
      console.time(label);
      console.log("Timer started", label);
    },
    timeEnd: (label: string) => {
      const start = timers[label];
      if (start) {
        const duration = performance.now() - start;
        const durationInSeconds = duration / 1000;
        log("info", `Timer '${label}': ${durationInSeconds.toFixed(2)}s`);
        delete timers[label];
      } else {
        log("warn", `Timer '${label}' does not exist`);
      }
      console.timeEnd(label);
      console.log("Timer ended", label);
    },
  };
};

export default logger();
