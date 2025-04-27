"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  CreatePostParams,
  ExtensionMessage,
  ExtensionResponse,
  SubstackError,
  UseExtension as UseExtension,
  BrowserType,
  GetSubstackCookiesResponse,
  Schedule,
} from "@/types/useExtension.type";
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
import { useUi } from "@/lib/hooks/useUi";

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

  const { canScheduleNotes } = useUi();

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
                Logger.info("Extension is firefox, with id: ", {
                  extensionId: process.env.NEXT_PUBLIC_EXTENSION_ID,
                  response,
                });
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
          Logger.info("Extension is chrome, with id: ", {
            extensionId: process.env.NEXT_PUBLIC_EXTENSION_ID,
          });
          chrome.runtime.sendMessage(
            process.env.NEXT_PUBLIC_EXTENSION_ID as string,
            pingMessage,
            (response: any) => {
              Logger.info("response", {
                response,
              });
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

  const sendExtensionMessage = async <T>(
    message: ExtensionMessage,
  ): Promise<ExtensionResponse<T>> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new Error(SubstackError.NETWORK_ERROR)),
        5000,
      );
      chrome.runtime.sendMessage(
        process.env.NEXT_PUBLIC_EXTENSION_ID!,
        message,
        (response: {
          success: boolean;
          data: {
            result: string;
            message: string;
            action: string;
          };
          error: string;
        }) => {
          clearTimeout(timeoutId);
          if (response.success) {
            const { result, message, action } = response.data;
            const isResultString = typeof result === "string";
            resolve({
              success: true,
              result: isResultString ? JSON.parse(result) : result,
              message,
              action,
            });
          } else {
            reject(new Error(response.error || SubstackError.UNKNOWN_ERROR));
          }
        },
      );
    });
  };

  /**
   * Create a new Substack post
   * @param {CreatePostParams} params Post parameters
   */
  const sendNote = useCallback(
    async (params: CreatePostParams): Promise<CreatePostResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        Logger.info("Sending note from useExtension", params);
        // Validate parameters
        if (!params.message || params.message.trim().length === 0) {
          throw new Error(SubstackError.INVALID_PARAMETERS);
        }

        const adf = await axios.post("/api/markdown-to-adf", {
          markdown: params.message,
        });
        Logger.info("adf", {
          data: JSON.stringify(adf.data),
        });

        const messageData = {
          bodyJson: adf.data,
          attachmentIds: params.attachmentIds,
        };
        // Prepare message for extension
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSubstackPost",
          params: [messageData],
        };

        // Send message to extension
        Logger.info("Sending message to extension", message);
        const sendMessageResponse =
          await sendExtensionMessage<CreatePostResponse>(message);
        Logger.info("sendMessageResponse", {
          data: JSON.stringify(sendMessageResponse),
        });
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
        Logger.error("Error in createNote", {
          error: JSON.stringify(error),
        });
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
   * Create a new schedule
   * @param {string} scheduleId Unique identifier for the schedule
   * @param {string} userId User identifier
   * @param {number} timestamp Unix timestamp when the schedule should trigger
   * @returns {Promise<Schedule>} Promise resolving to the created schedule
   */
  const createSchedule = useCallback(
    async (
      scheduleId: string,
      userId: string,
      timestamp: number,
    ): Promise<Schedule | null> => {
      if (!canScheduleNotes) {
        return null;
      }
      try {
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSchedule",
          params: [scheduleId, userId, timestamp],
        };

        const response = await sendExtensionMessage<Schedule>(message);

        if (response.success && response.result) {
          return response.result;
        }
        throw new Error("Failed to create schedule");
      } catch (error) {
        console.error("Error creating schedule:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Unknown error creating schedule");
      }
    },
    [sendExtensionMessage],
  );

  /**
   * Delete a schedule by ID
   * @param {string} scheduleId ID of the schedule to delete
   * @returns {Promise<boolean>} Promise resolving to boolean indicating success
   */
  const deleteSchedule = useCallback(
    async (scheduleId: string): Promise<boolean> => {
      if (!canScheduleNotes) {
        return true;
      }
      try {
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "deleteSchedule",
          params: [scheduleId],
        };

        const response = await sendExtensionMessage<boolean>(message);
        if (response.success && response.result !== undefined) {
          return response.result;
        }
        return false;
      } catch (error) {
        console.error("Error deleting schedule:", error);
        return false;
      }
    },
    [sendExtensionMessage],
  );

  /**
   * Get all schedules
   * @returns {Promise<Schedule[]>} Promise resolving to array of schedules
   */
  const getSchedules = useCallback(async (): Promise<Schedule[]> => {
    try {
      const message: ExtensionMessage = {
        type: "API_REQUEST",
        action: "getSchedules",
        params: [],
      };

      const response = await sendExtensionMessage<Schedule[]>(message);
      if (response.success && response.result) {
        return response.result;
      }
      return [];
    } catch (error) {
      console.error("Error getting schedules:", error);
      return [];
    }
  }, [sendExtensionMessage]);

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
    createSchedule,
    deleteSchedule,
    getSchedules,
  };
}
