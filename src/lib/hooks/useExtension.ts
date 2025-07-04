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
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { CreatePostResponse } from "@/types/createPostResponse";
import { Logger } from "@/logger";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { AttachmentType, FeatureFlag } from "@prisma/client";
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
  setShowExtensionDisabledDialog,
  setShowNoSubstackCookiesDialog,
} from "@/lib/features/ui/uiSlice";
import { NoCookiesError } from "@/types/errors/NoCookiesError";
import { useUi } from "@/lib/hooks/useUi";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import axiosInstance from "@/lib/axios-instance";
import {
  NoteStats,
  NoteWithEngagementStats,
  ReactionInterval,
} from "@/types/notes-stats";

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
      const maxRetries = 3;
      let retries = 0;
      let verificationStatus: {
        message: "success" | "error" | "pending" | "outdated";
      } = { message: "pending" };
      while (retries < maxRetries) {
        verificationStatus = await verifyExtension();
        if (verificationStatus.message === "error") {
          if (options?.showDialog) {
            dispatch(setShowExtensionDialog(true));
          }
          if (options?.throwIfNoExtension) {
            throw new NoExtensionError("Extension not found");
          }
          return false;
        } else if (verificationStatus.message === "success") {
          break;
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return verificationStatus.message === "success";
    },
    [verifyExtension],
  );

  //  substack cookies ("getSubstackCookies") from the extension. The name of the function is getSubstackCookies
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
      await axiosInstance.post("/api/user/cookies", response.result);
    } catch (error) {
      Logger.error(
        "Error setting user substack cookies: " + JSON.stringify(error),
      );
    }
  }, [browserType]);

  const sendExtensionMessage = async <T>(
    message: ExtensionMessage,
    options: {
      showDialog?: boolean;
      throwIfNoExtension?: boolean;
      timeout?: number;
    },
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
        if (message.action === "getNotesStats") {
          Logger.info(
            "GETTING-NOTES-STATS: sendExtensionMessage: canUseExtension",
            {
              canUseExtension,
            },
          );
        }
        if (!canUseExtension) {
          dispatch(setShowExtensionDisabledDialog(true));
          reject(new Error(SubstackError.EXTENSION_DISABLED));
          return;
        }
        const timeoutId = setTimeout(() => {
          Logger.warn("Extension timeout for" + message.action, {
            message,
            options,
          });
          reject(new Error(SubstackError.NETWORK_ERROR));
        }, options.timeout || 30000);
        const runtime = chrome.runtime;
        if (!runtime) {
          Logger.error("[CRITICAL]EXTENSION MESSAGE ERROR: ", {
            error: "Runtime not found",
          });
          reject(new Error(SubstackError.NETWORK_ERROR));
          // toast.error("Extension not found. Please, install the extension.");
          return;
        }

        const messageWithSource = {
          ...message,
          source: "write-stack",
        };

        runtime.sendMessage(
          process.env.NEXT_PUBLIC_EXTENSION_ID!,
          messageWithSource,
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
            if (message.action === "getNotesStats") {
              Logger.info(
                "GETTING-NOTES-STATS: sendExtensionMessage: response",
                {
                  response,
                },
              );
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
              reject({
                error: response?.error || SubstackError.UNKNOWN_ERROR,
                message: response?.data?.message || "",
                action: response?.data?.action || "",
                result: response?.data?.result || "",
                success: false,
              });
            }
          },
        );
      } catch (error) {
        if (message.action === "createSchedule") {
          Logger.error(
            `ADDING-SCHEDULE: sendExtensionMessage: error: ${JSON.stringify(error)}`,
            {
              error,
            },
          );
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

  const updateNotesStatistics = useCallback(async () => {
    const timeoutSixtyMinutes = 60 * 60 * 1000;
    Logger.info("Updating notes statistics", {
      timeout: timeoutSixtyMinutes,
    });
    const response = await sendExtensionMessage<any>(
      {
        type: "API_REQUEST",
        action: "setNotesStats",
      },
      {
        showDialog: false,
        throwIfNoExtension: false,
        timeout: timeoutSixtyMinutes,
      },
    );
    if (response.success) {
      return response.result;
    } else {
      throw new Error(response.error || SubstackError.UNKNOWN_ERROR);
    }
  }, [sendExtensionMessage]);

  const getNotesStatistics = useCallback(
    async (interval: ReactionInterval): Promise<NoteStats | null> => {
      const response = await sendExtensionMessage<NoteStats>(
        {
          type: "API_REQUEST",
          action: "getNotesStats",
          params: [interval],
        },
        {
          showDialog: false,
          throwIfNoExtension: false,
        },
      );
      if (response.success) {
        return response.result || null;
      } else {
        throw new Error(response.error || SubstackError.UNKNOWN_ERROR);
      }
    },
    [sendExtensionMessage],
  );

  const getNotesWithStatsForDate = useCallback(
    async (
      date: string,
      options?: {
        orderBy?: string;
        orderDirection?: "asc" | "desc";
        page?: number;
        limit?: number;
      },
    ) => {
      const optionsParams: Record<string, string> = {
        orderBy: options?.orderBy || "createdAt",
        orderDirection: options?.orderDirection || "desc",
        page: options?.page?.toString() || "1",
        limit: options?.limit?.toString() || "10",
      };
      const response = await sendExtensionMessage<NoteWithEngagementStats[]>(
        {
          type: "API_REQUEST",
          action: "getNotesWithStatsForDate",
          params: [date, optionsParams],
        },
        {
          showDialog: false,
          throwIfNoExtension: false,
        },
      );
      if (response.success) {
        return response.result || [];
      } else {
        setError(response.error || SubstackError.UNKNOWN_ERROR);
        return [];
      }
    },
    [sendExtensionMessage],
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
        Logger.info("Sending note from useExtension", params);
        // Validate parameters
        if (!params.message || params.message.trim().length === 0) {
          throw new Error(SubstackError.INVALID_PARAMETERS);
        }

        const adfResponse = await axiosInstance.post("/api/markdown-to-adf", {
          markdown: params.message,
          noteId: params.noteId,
        });
        Logger.info("adf", {
          data: JSON.stringify(adfResponse.data),
        });
        const adf = adfResponse.data;

        /**
         * @extension-v1.9.97
         * Add attachmentUrls to the message for backward compatibility with extension v1.3.97
         */
        const nonLinkAttachments = params.attachments?.filter(
          attachment => attachment.type !== AttachmentType.link,
        );
        const attachmentUrls = nonLinkAttachments?.map(
          attachment => attachment.url,
        );
        const messageData = {
          attachmentUrls, // Backward compatibility extension v1.3.97
          bodyJson: adf,
          attachments: params.attachments,
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
    async (schedule: {
      scheduleId: string;
      userId: string;
      noteId: string;
      timestamp: number;
    }): Promise<Schedule | null> => {
      // if (!canScheduleNotes) {
      //   return null;
      // }
      const { scheduleId, userId, noteId, timestamp } = schedule;
      Logger.info("ADDING-SCHEDULE: createSchedule", {
        scheduleId,
        userId,
        timestamp,
        noteId,
      });
      try {
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSchedule",
          params: [scheduleId, userId, timestamp, noteId],
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
      // if (!canScheduleNotes) {
      //   return true;
      // }
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

  const verifyExtensionKey = useCallback(async () => {
    let key: string | null = null;
    let authorId: number | null = null;

    const retry = async () => {
      Logger.warn("Error verifying extension key, retrying...");
      // try generate and verify key
      const keyResponse = await axiosInstance.post(
        "/api/v1/extension/key/generate",
      );
      key = keyResponse.data.key;
      authorId = keyResponse.data.authorId;
      // send to extension, if exists, "verifyKey"
      const message: ExtensionMessage = {
        type: "API_REQUEST",
        action: "verifyKey",
        params: [key, authorId],
      };
      const responseExtensionSecondTry = await sendExtensionMessage<boolean>(
        message,
        {
          showDialog: false,
          throwIfNoExtension: false,
        },
      );
      if (!responseExtensionSecondTry.success) {
        Logger.error("Error verifying extension key", {
          error: responseExtensionSecondTry.error,
        });
        return false;
      } else {
        await axiosInstance.post("/api/v1/extension/key/verify", { key });
        localStorage.setItem("extensionKey", key || "");
        return true;
      }
    };
    try {
      const response = await axiosInstance.get("/api/v1/extension/key");
      if (!response.data.key) {
        // generate key
        const keyResponse = await axiosInstance.post(
          "/api/v1/extension/key/generate",
        );
        key = keyResponse.data.key;
        authorId = keyResponse.data.authorId;
      } else {
        key = response.data.key;
        authorId = response.data.authorId;
      }
      if (!key) {
        Logger.error("No extension key found after generation");
        return false;
      }

      // send to extension, if exists, "verifyKey"
      const message: ExtensionMessage = {
        type: "API_REQUEST",
        action: "verifyKey",
        params: [key, authorId],
      };
      const responseExtension = await sendExtensionMessage<boolean>(message, {
        showDialog: false,
        throwIfNoExtension: false,
      });
      if (!responseExtension.success) {
        await retry();
      }
      // save key to local storage
      await axiosInstance.post("/api/v1/extension/key/verify", { key });
      localStorage.setItem("extensionKey", key || "");
      return true;
    } catch (error) {
      Logger.error("Error verifying extension key", { error });
      await retry();
      return false;
    }
  }, []);

  // call updateExtensionDataInDB from extension
  const updateExtensionData = useCallback(async () => {
    const message: ExtensionMessage = {
      type: "API_REQUEST",
      action: "updateExtensionDataInDB",
    };
    const response = await sendExtensionMessage<boolean>(message, {
      showDialog: false,
      throwIfNoExtension: false,
    });
    if (!response.success) {
      Logger.error("Error updating extension data", {
        error: response.error,
      });
      return false;
    } else {
      return true;
    }
  }, []);

  return {
    isLoading,
    error,
    postResponse,
    canUseSubstackPost: canUseSubstackPost || false,
    browserType,
    getNoteById,
    hasExtension,
    setUserSubstackCookies,
    sendNote,
    createSchedule,
    deleteSchedule,
    getSchedules,
    verifyExtension,
    updateNotesStatistics,
    getNotesStatistics,
    getNotesWithStatsForDate,
    verifyExtensionKey,
    updateExtensionData,
  };
}
