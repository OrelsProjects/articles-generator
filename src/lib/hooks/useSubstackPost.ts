"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  CreatePostParams,
  ExtensionMessage,
  ExtensionResponse,
  SubstackError,
  UseSubstackPost,
} from "@/types/useSubstack.type";
import axios from "axios";
import { CreatePostResponse } from "@/types/createPostResponse";
import { Logger } from "@/logger";
import { useAppSelector } from "@/lib/hooks/redux";
import { FeatureFlag } from "@prisma/client";
import { useNotes } from "@/lib/hooks/useNotes";
/**
 * Custom hook for creating Substack posts through a Chrome extension
 * @returns {UseSubstackPost} Hook methods and state
 */
export function useSubstackPost(): UseSubstackPost {
  const { user } = useAppSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postResponse, setPostResponse] = useState<CreatePostResponse | null>(
    null,
  );

  const loadingPing = useRef(false);

  const canUseSubstackPost = useMemo(
    () => user?.meta?.featureFlags.includes(FeatureFlag.instantPost),
    [user?.meta?.featureFlags],
  );

  const verifyExtension = useCallback(async (): Promise<
    "success" | "error" | "pending"
  > => {
    if (!chrome.runtime) return "error";
    if (loadingPing.current) return "pending";
    loadingPing.current = true;
    const pingMessage: ExtensionMessage = {
      type: "PING",
    };
    setTimeout(() => {
      loadingPing.current = false;
    }, 5000);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        process.env.NEXT_PUBLIC_EXTENSION_ID,
        pingMessage,
        response => {
          if (response.success) {
            resolve("success");
          } else {
            Logger.error(
              "Extension not found" + JSON.stringify(response || ""),
            );
            resolve("error");
          }
        },
      );
    });
  }, []);

  const sendExtensionMessage = useCallback(
    async (
      message: ExtensionMessage,
    ): Promise<ExtensionResponse<CreatePostResponse>> => {
      return new Promise(async (resolve, reject) => {
        const verificationStatus = await verifyExtension();
        if (verificationStatus === "error") {
          reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
        }
        if (verificationStatus === "pending") {
          reject(new Error(SubstackError.PENDING));
        }
        if (verificationStatus === "success") {
          try {
            chrome.runtime.sendMessage(
              process.env.NEXT_PUBLIC_EXTENSION_ID,
              { ...message },
              response => {
                if (response.success) {
                  const result = JSON.parse(
                    response.data.result,
                  ) as CreatePostResponse;
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
          } catch (error) {
            reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
          }
        }

        // Set timeout for response
        setTimeout(() => {
          reject(new Error(SubstackError.NETWORK_ERROR));
        }, 10000); // 10 second timeout
      });
    },
    [],
  );

  /**
   * Create a new Substack post
   * @param {CreatePostParams} params Post parameters
   */
  const createPost = useCallback(
    async (params: CreatePostParams): Promise<CreatePostResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
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
        const sendMessageResponse = await sendExtensionMessage(message);

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
        console.log("Error in createPost", error);
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

  return {
    createPost,
    isLoading,
    error,
    postResponse,
    canUseSubstackPost: canUseSubstackPost || false,
  };
}
