import AppUser from "@/types/appUser";
import { StatusType, datadogLogs } from "@datadog/browser-logs";

interface Dict {
  [key: string]: any;
}

let isLoggerInitialized = false;

export type LogItem = Dict;

export const setUserLogger = (user?: AppUser | null) => {
  datadogLogs.setUser({
    ...user,
    email: user?.email || "",
    name: user?.displayName || undefined,
  });
};

export const initLogger = () => {
  if (typeof window !== "undefined") {
    if ((window as any).__DATADOG_LOGGER_INITIALIZED__) return;
    (window as any).__DATADOG_LOGGER_INITIALIZED__ = true;
  } else if (isLoggerInitialized) {
    return;
  }
  try {
    const env = process.env.NEXT_PUBLIC_ENV ?? "development";
    datadogLogs.init({
      clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN ?? "",
      site: process.env.NEXT_PUBLIC_DATADOG_SITE ?? "",
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
      service: process.env.NEXT_PUBLIC_DATADOG_SERVICE ?? "",
      env,
    });
  } catch (error: any) {
    Logger.error("Error initializing logger", {
      error,
    });
  }
  isLoggerInitialized = true;
};

const log = (
  type: StatusType,
  message: string,
  logItem?: LogItem,
  error?: any,
) => {
  printLog(type, message, error, logItem);
  try {
    const env = process.env.NODE_ENV;
    if (env === "development") {
      return;
    }
    // Build message from message, logItem, and error
    const rawMessage = `${message} ${logItem ? JSON.stringify(logItem) : ""} ${error ? JSON.stringify(error) : ""}`;
    datadogLogs.logger.log(rawMessage, logItem, type, error);
  } catch (error: any) {}
};

const printLog = (
  type: StatusType,
  message?: string,
  error?: any,
  logItem?: LogItem,
) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const logText = `${`${type || ""}: `}${message ?? ""} ${
    logItem ? JSON.stringify(logItem) : ""
  } ${logItem?.error ? JSON.stringify(logItem.error) : ""}
  }`;
  switch (type) {
    case StatusType.info:
      console.info(logText);
      break;
    case StatusType.warn:
      console.warn(logText);
      break;
    case StatusType.error:
      console.error(logText);
      break;
    case StatusType.debug:
      console.log(logText);
      break;
    default:
      console.log(message, logItem);
      break;
  }
};

export class Logger {
  static info(message: string, logItem?: LogItem) {
    log(StatusType.info, message, logItem);
  }

  static warn(message: string, logItem?: LogItem) {
    log(StatusType.warn, message, logItem);
  }

  static error(message: string, logItem?: LogItem) {
    log(StatusType.error, message, logItem);
  }

  static debug(message: string, logItem?: LogItem) {
    log(StatusType.debug, message, logItem);
  }
}
