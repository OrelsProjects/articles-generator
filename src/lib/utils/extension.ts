import { Logger } from "@/logger";
import { BrowserType, ExtensionMessage } from "@/types/useExtension.type";

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

/**
 * Compare two versions
 * @param version1 - The first version to compare
 * @param version2 - The second version to compare
 * @returns "biggerThen" | "smallerThen" | "equal". biggerThan if version1 is greater than version2, smallerThan if version1 is smaller than version2, equal if they are equal
 */
export const compareVersions = (
  version1?: string,
  version2?: string,
): "biggerThen" | "smallerThen" | "equal" => {
  if (!version1 || !version2) return "equal";
  const v1 = version1.split(".");
  const v2 = version2.split(".");
  for (let i = 0; i < v1.length && i < v2.length; i++) {
    const diff = parseInt(v1[i]) - parseInt(v2[i]);
    if (diff !== 0) return diff > 0 ? "biggerThen" : "smallerThen";
  }

  return "equal";
};
