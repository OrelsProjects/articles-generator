/* eslint-disable no-unused-vars */
import { createLogger, format, transports } from "winston";
import { LogItem } from "./logger";

interface Logger {
  debug: (message: string, data?: LogItem) => void;
  info: (message: string, data?: LogItem) => void;
  error: (message: string, data?: LogItem) => void;
  warn: (message: string, data?: LogItem) => void;
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

const logger: () => Logger = () => {
  const log = (
    level: "info" | "error" | "warn" | "debug",
    message: string,
    data?: LogItem,
  ) => {
    try {
      _logger.log(level, message, {
        data,
        env: process.env.ENVIRONMENT,
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
  };
};

export default logger();
