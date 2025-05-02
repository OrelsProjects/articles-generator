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
  GetSchedulesResponse,
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
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { toast } from "react-toastify";

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
  const [extensionAvailable] = useLocalStorage<{
    version: string;
    date: number;
  } | null>("has_extension", null);
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

  const verifyExtension = useCallback(async (): Promise<{
    message: "success" | "error" | "pending" | "outdated";
    version?: string;
    date?: number;
  }> => {
    if (typeof window === "undefined") return { message: "error" };
    if (loadingPing.current) return { message: "pending" };

    loadingPing.current = true;
    const pingMessage: ExtensionMessage = {
      type: "PING",
    };

    setTimeout(() => {
      loadingPing.current = false;
    }, 3000);

    return new Promise(resolve => {
      try {
        Logger.info("Extension is chrome, with id: ", {
          extensionId: process.env.NEXT_PUBLIC_EXTENSION_ID,
        });
        chrome.runtime.sendMessage(
          process.env.NEXT_PUBLIC_EXTENSION_ID as string,
          pingMessage,
          (response: any) => {
            Logger.info("EXTENSION PING RESPONSE", {
              response,
            });
            if (response?.success) {
              resolve({
                message: "success",
                version: response.version,
                date: response.timestamp,
              });
              return;
            } else {
              Logger.error(
                "Extension not found in Chrome: " +
                  JSON.stringify(response || ""),
              );
              resolve({ message: "error" });
              return;
            }
          },
        );
      } catch (error) {
        Logger.error("Extension verify error: " + JSON.stringify(error));
        resolve({ message: "error" });
      }
    });
  }, [browserType]);

  const hasExtension = useCallback(
    async (options?: {
      showDialog?: boolean;
      throwIfNoExtension?: boolean;
    }): Promise<boolean> => {
      if (!!extensionAvailable) {
        return true;
      }

      const verificationStatus = await verifyExtension();
      if (verificationStatus.message === "error") {
        if (options?.showDialog) {
          dispatch(setShowExtensionDialog(true));
        }
        if (options?.throwIfNoExtension) {
          throw new NoExtensionError("Extension not found");
        }
        return false;
      }

      return verificationStatus.message === "success";
    },
    [verifyExtension],
  );

  // get substack cookies ("getSubstackCookies") from the extension. The name of the function is getSubstackCookies
  const setUserSubstackCookies = useCallback(async (): Promise<void> => {
    const response = await sendExtensionMessage<GetSubstackCookiesResponse>(
      {
        type: "API_REQUEST",
        action: "getSubstackCookies",
      },
      {
        showDialog: false,
      },
    );
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
    options: { showDialog?: boolean; throwIfNoExtension?: boolean },
  ): Promise<ExtensionResponse<T>> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (message.action === "createSchedule") {
          Logger.info("ADDING-SCHEDULE: sendExtensionMessage: createSchedule", {
            message,
          });
        }
        const canUseExtension = await hasExtension(options);
        if (message.action === "createSchedule") {
          Logger.info(
            "ADDING-SCHEDULE: sendExtensionMessage: canUseExtension",
            {
              canUseExtension,
            },
          );
        }
        if (!canUseExtension) {
          reject(new Error(SubstackError.EXTENSION_DISABLED));
          return;
        }
        const timeoutId = setTimeout(
          () => reject(new Error(SubstackError.NETWORK_ERROR)),
          30000,
        );
        const runtime = chrome.runtime;
        if (!runtime) {
          Logger.error("[CRITICAL]EXTENSION MESSAGE ERROR: ", {
            error: "Runtime not found",
          });
          reject(new Error(SubstackError.NETWORK_ERROR));
          // toast.error("Extension not found. Please, install the extension.");
          return;
        }
        runtime.sendMessage(
          process.env.NEXT_PUBLIC_EXTENSION_ID!,
          message,
          (response?: {
            success: boolean;
            data: {
              result: string;
              message: string;
              action: string;
            };
            error: string;
          }) => {
            if (message.action === "createSchedule") {
              Logger.info("ADDING-SCHEDULE: sendExtensionMessage: response", {
                response,
              });
            }
            clearTimeout(timeoutId);
            if (response?.success) {
              const { result, message, action } = response.data;
              const isResultString = typeof result === "string";
              resolve({
                success: true,
                result: isResultString ? JSON.parse(result) : result,
                message,
                action,
              });
            } else {
              reject(new Error(response?.error || SubstackError.UNKNOWN_ERROR));
            }
          },
        );
      } catch (error) {
        if (message.action === "createSchedule") {
          Logger.error(`ADDING-SCHEDULE: sendExtensionMessage: error: ${JSON.stringify(error)}`, {
            error,
          });
        } else {
          Logger.error(`EXTENSION MESSAGE ERROR: ${JSON.stringify(error)}`, {
            error,
            message,
            options,
          });
        }
        reject(error);
      }
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
          await sendExtensionMessage<CreatePostResponse>(message, {
            showDialog: true,
            throwIfNoExtension: true,
          });
        Logger.info("sendMessageResponse", {
          data: JSON.stringify(sendMessageResponse),
        });
        if (sendMessageResponse?.success && sendMessageResponse?.result) {
          setPostResponse(sendMessageResponse.result);
          setIsLoading(false);
          return sendMessageResponse.result;
        } else {
          throw new Error(
            sendMessageResponse?.error || SubstackError.UNKNOWN_ERROR,
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
      Logger.info("ADDING-SCHEDULE: createSchedule", {
        scheduleId,
        userId,
        timestamp,
      });
      try {
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSchedule",
          params: [scheduleId, userId, timestamp],
        };

        Logger.info(
          "ADDING-SCHEDULE: createScheduleExtension: About to send message",
          {
            message,
          },
        );

        const response = await sendExtensionMessage<Schedule>(message, {
          showDialog: true,
          throwIfNoExtension: true,
        });

        Logger.info("ADDING-SCHEDULE: createScheduleExtension: response", {
          response: JSON.stringify(response),
        });

        if (response?.success && response?.result) {
          Logger.info("ADDING-SCHEDULE: createScheduleExtension: success", {
            response: JSON.stringify(response),
          });
          return response.result;
        }
        throw new Error("Failed to create schedule");
      } catch (error) {
        Logger.error("ADDING-SCHEDULE: createScheduleExtension: error", {
          error: JSON.stringify(error),
        });
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

        const response = await sendExtensionMessage<boolean>(message, {
          showDialog: true,
          throwIfNoExtension: true,
        });
        if (response.success && response.result !== undefined) {
          return response.result;
        }
        return false;
      } catch (error) {
        Logger.error("Error deleting schedule:", { error: String(error) });
        return false;
      }
    },
    [sendExtensionMessage],
  );

  /**
   * Get all schedules
   * @returns {Promise<Schedule[]>} Promise resolving to array of schedules
   */
  const getSchedules = useCallback(async (): Promise<GetSchedulesResponse> => {
    try {
      const message: ExtensionMessage = {
        type: "API_REQUEST",
        action: "getSchedules",
        params: [],
      };

      const response = await sendExtensionMessage<GetSchedulesResponse>(
        message,
        {
          showDialog: false,
        },
      );
      debugger;
      if (response.success) {
        if (response.result) {
          return response.result;
        } else {
          return { schedules: [], alarms: [] };
        }
      }
      throw new Error(response.error || SubstackError.UNKNOWN_ERROR);
    } catch (error) {
      Logger.error("Error getting schedules:", { error: String(error) });
      throw error;
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
    verifyExtension,
  };
}
