"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  CreatePostParams,
  ExtensionMessage,
  ExtensionResponse,
  SubstackError,
  UseSubstackPost as UseExtension,
  BrowserType,
  GetSubstackCookiesResponse,
} from "@/types/useSubstack.type";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { CreatePostResponse } from "@/types/createPostResponse";
import { Logger } from "@/logger";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { FeatureFlag, Note } from "@prisma/client";
import { NoteDraft } from "@/types/note";
import {
  extensionApiRequest,
  getSubstackCookiesExpiration,
  RouteBody,
} from "@/lib/api/api";
import { ApiRoute } from "@/lib/api/api";
import { NoExtensionError } from "@/types/errors/NoExtensionError";
import {
  setShowExtensionDialog,
  setShowNoSubstackCookiesDialog,
} from "@/lib/features/ui/uiSlice";
import { NoCookiesError } from "@/types/errors/NoCookiesError";

/**
 * Detects the current browser type
 * @returns {BrowserType} The detected browser type
 */
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

/**
 * Custom hook for creating Substack posts through a browser extension
 * @returns {UseExtension} Hook methods and state
 */
export function useExtension(): UseExtension {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { userNotes } = useAppSelector(state => state.notes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postResponse, setPostResponse] = useState<CreatePostResponse | null>(
    null,
  );
  const [browserType, setBrowserType] = useState<BrowserType>("unknown");

  const loadingPing = useRef(false);

  const canUseSubstackPost = useMemo(
    () => user?.meta?.featureFlags.includes(FeatureFlag.instantPost),
    [user?.meta?.featureFlags],
  );

  // Set browser type on client side
  useMemo(() => {
    if (typeof window !== "undefined") {
      setBrowserType(detectBrowser());
    }
  }, []);

  const verifyExtension = useCallback(async (): Promise<
    "success" | "error" | "pending" | "outdated"
  > => {
    if (typeof window === "undefined") return "error";
    if (loadingPing.current) return "pending";

    loadingPing.current = true;
    const pingMessage: ExtensionMessage = {
      type: "PING",
    };

    setTimeout(() => {
      loadingPing.current = false;
    }, 5000);

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
          console.log(
            "Extension is chrome, with id: ",
            process.env.NEXT_PUBLIC_EXTENSION_ID,
          );
          chrome.runtime.sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID as string,
            pingMessage,
            (response: any) => {
              console.log("response", response);
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
  }, [browserType]);

  const hasExtension = useCallback(async (): Promise<boolean> => {
    const verificationStatus = await verifyExtension();
    return verificationStatus === "success";
  }, [verifyExtension]);

  // get substack cookies ("getSubstackCookies") from the extension. The name of the function is getSubstackCookies
  const setUserSubstackCookies = useCallback(async (): Promise<void> => {
    const response = await sendExtensionMessage<GetSubstackCookiesResponse>({
      type: "API_REQUEST",
      action: "getSubstackCookies",
    });
    try {
      await axios.post("/api/user/cookies", response.result);
    } catch (error) {
      Logger.error(
        "Error setting user substack cookies: " + JSON.stringify(error),
      );
    }
  }, [browserType]);

  const sendExtensionMessage = useCallback(
    async <T>(message: ExtensionMessage): Promise<ExtensionResponse<T>> => {
      return new Promise(async (resolve, reject) => {
        // console.log("Sending extension message", message);
        // const verificationStatus = await verifyExtension();
        // console.log("Verification status", verificationStatus);
        // if (verificationStatus === "error") {
        //   reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
        //   return;
        // }
        // if (verificationStatus === "pending") {
        //   reject(new Error(SubstackError.PENDING));
        //   return;
        // }

        // // Set timeout for response
        const timeoutId = setTimeout(() => {
          reject(new Error(SubstackError.NETWORK_ERROR));
        }, 10000); // 10 second timeout

        try {
          // Firefox implementation
          if (browserType === "firefox" && typeof browser !== "undefined") {
            browser.runtime
              .sendMessage(process.env.NEXT_PUBLIC_EXTENSION_ID as string, {
                ...message,
              })
              .then((response: any) => {
                clearTimeout(timeoutId);
                if (response.success) {
                  const result = JSON.parse(response.data.result) as T;
                  resolve({
                    success: response.success,
                    result,
                    message: response.message,
                    action: response.action,
                    error: response.error,
                  });
                } else {
                  reject(
                    new Error(response.error || SubstackError.UNKNOWN_ERROR),
                  );
                }
              })
              .catch((error: unknown) => {
                clearTimeout(timeoutId);
                reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
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
              { ...message },
              (response: any) => {
                console.log("Response from chrome", response);
                clearTimeout(timeoutId);
                if (response.success) {
                  const result = JSON.parse(response.data.result) as T;
                  resolve({
                    success: response.success,
                    result,
                    message: response.message,
                    action: response.action,
                    error: response.error,
                  });
                } else {
                  reject(
                    new Error(response.error || SubstackError.UNKNOWN_ERROR),
                  );
                }
              },
            );
          } else {
            clearTimeout(timeoutId);
            reject(new Error(SubstackError.BROWSER_NOT_SUPPORTED));
          }
        } catch (error) {
          clearTimeout(timeoutId);
          reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
        }
      });
    },
    [browserType, verifyExtension],
  );

  /**
   * Create a new Substack post
   * @param {CreatePostParams} params Post parameters
   */
  const sendNote = useCallback(
    async (params: CreatePostParams): Promise<CreatePostResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Sending note from useExtension", params);
        // Validate parameters
        if (!params.message || params.message.trim().length === 0) {
          throw new Error(SubstackError.INVALID_PARAMETERS);
        }

        const adf = await axios.post("/api/markdown-to-adf", {
          markdown: params.message,
        });
        const messageData = { bodyJson: adf.data };
        // Prepare message for extension
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSubstackPost",
          params: [messageData],
        };

        // Send message to extension
        console.log("Sending message to extension", message);
        const sendMessageResponse =
          await sendExtensionMessage<CreatePostResponse>(message);
        console.log("sendMessageResponse", sendMessageResponse);
        if (sendMessageResponse.success && sendMessageResponse.result) {
          setPostResponse(sendMessageResponse.result);
          setIsLoading(false);
          return sendMessageResponse.result;
        } else {
          throw new Error(
            sendMessageResponse.error || SubstackError.UNKNOWN_ERROR,
          );
        }
      } catch (error) {
        console.log("Error in createNote", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(SubstackError.UNKNOWN_ERROR);
        }
        setIsLoading(false);
        throw error;
      }
    },
    [sendExtensionMessage],
  );

  const getNoteById = useCallback(
    (noteId: string): NoteDraft | null => {
      return userNotes.find(note => note.id === noteId) || null;
    },
    [userNotes],
  );

  /**
 * <T extends ApiRoute, R = any>(
  route: T,
  body: RouteBody<T>,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<R>>
 */
  const sendExtensionApiRequest = async <T extends ApiRoute, R = any>(
    route: T,
    body: RouteBody<T>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<R>> => {
    const cookiesValid = await getSubstackCookiesExpiration(config);
    if (!cookiesValid.valid) {
      const userHasExtension = await hasExtension();
      if (!userHasExtension) {
        debugger;
        dispatch(setShowExtensionDialog(true));
        throw new NoExtensionError(
          "Authentication required. Please log in to Substack.",
        );
      } else {
        dispatch(setShowNoSubstackCookiesDialog(true));
        throw new NoCookiesError(
          "Authentication required. Please log in to Substack.",
        );
      }
    }
    return await extensionApiRequest<T, R>(route, body, config);
  };

  return {
    isLoading,
    error,
    postResponse,
    canUseSubstackPost: canUseSubstackPost || false,
    browserType,
    getNoteById,
    hasExtension,
    setUserSubstackCookies,
    sendExtensionApiRequest,
    sendNote,
  };
}
