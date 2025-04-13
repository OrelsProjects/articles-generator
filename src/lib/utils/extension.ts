import { Logger } from "@/logger";
import { BrowserType, ExtensionMessage } from "@/types/useSubstack.type";

const detectBrowser = (): BrowserType => {
  if (typeof window === "undefined") return "unknown";

  // Check for Firefox
  if (
    typeof window.browser !== "undefined" ||
    navigator.userAgent.indexOf("Firefox") !== -1
  ) {
    return "firefox";
  }

  // Check for Chrome
  if (typeof chrome !== "undefined" && !!chrome.runtime) {
    return "chrome";
  }

  return "unknown";
};
export const hasExtension = async (): Promise<
  "success" | "error" | "pending" | "outdated"
> => {
  if (typeof window === "undefined") return "error";
  const browserType = detectBrowser();

  const pingMessage: ExtensionMessage = {
    type: "PING",
  };

  return new Promise(resolve => {
    try {
      // Firefox implementation
      if (browserType === "firefox" && typeof browser !== "undefined") {
        browser.runtime
          .sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID as string,
            pingMessage,
          )
          .then((response: any) => {
            if (response?.success) {
              resolve("success");
            } else {
              Logger.error(
                "Extension not found in Firefox: " +
                  JSON.stringify(response || ""),
              );
              resolve("error");
            }
          })
          .catch((err: unknown) => {
            Logger.error("Firefox extension error: " + JSON.stringify(err));
            resolve("error");
          });
      }
      // Chrome implementation
      else if (
        browserType === "chrome" &&
        typeof chrome !== "undefined" &&
        chrome.runtime
      ) {
        chrome.runtime.sendMessage(
          process.env.NEXT_PUBLIC_EXTENSION_ID as string,
          pingMessage,
          (response: any) => {
            if (response?.success) {
              resolve("success");
            } else {
              Logger.error(
                "Extension not found in Chrome: " +
                  JSON.stringify(response || ""),
              );
              resolve("error");
            }
          },
        );
      } else {
        Logger.error("Unsupported browser or extension API not available");
        resolve("error");
      }
    } catch (error) {
      Logger.error("Extension verify error: " + JSON.stringify(error));
      resolve("error");
    }
  });
};
