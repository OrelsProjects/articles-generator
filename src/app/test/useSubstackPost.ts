"use client";

import { useState, useCallback } from "react";
import {
  CreatePostParams,
  ExtensionMessage,
  ExtensionResponse,
  SubstackError,
  UseSubstackPost,
} from "./types";
import axios from "axios";

const EXTENSION_ORIGIN = "chrome-extension://bmkhkeelhgcnpmemdmlfjfndcolhhkaj";

/**
 * Custom hook for creating Substack posts through a Chrome extension
 * @returns {UseSubstackPost} Hook methods and state
 */
export function useSubstackPost(): UseSubstackPost {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send message to extension and wait for response
   */
  const sendExtensionMessage = useCallback(
    async (message: ExtensionMessage): Promise<ExtensionResponse> => {
      return new Promise((resolve, reject) => {
        // Set up listener for response
        const handleMessage = (event: MessageEvent) => {
          console.log("handleMessage", event);
          // Verify the message is from our extension
          if (event.origin !== EXTENSION_ORIGIN) return;

          const response = event.data as ExtensionResponse;

          // Remove listener after receiving response
          window.removeEventListener("message", handleMessage);

          if (!response.success) {
            reject(new Error(response.error || SubstackError.UNKNOWN_ERROR));
          } else {
            resolve(response);
          }
        };

        // Add listener for response
        window.addEventListener("message", handleMessage);

        // Send message to extension
        try {
          chrome.runtime.sendMessage(
            "bmkhkeelhgcnpmemdmlfjfndcolhhkaj", // your extension ID
            { ...message },
            response => {
              console.log("Got a response from the extension:", response);
            },
          );
        } catch (error) {
          window.removeEventListener("message", handleMessage);
          reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
        }

        // Set timeout for response
        setTimeout(() => {
          window.removeEventListener("message", handleMessage);
          reject(new Error(SubstackError.NETWORK_ERROR));
        }, 5000); // 5 second timeout
      });
    },
    [],
  );

  /**
   * Create a new Substack post
   * @param {CreatePostParams} params Post parameters
   */
  const createPost = useCallback(
    async (params: CreatePostParams): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate parameters
        if (!params.message || params.message.trim().length === 0) {
          throw new Error(SubstackError.INVALID_PARAMETERS);
        }

        // Prepare message for extension
        const message: ExtensionMessage = {
          type: "API_REQUEST",
          action: "createSubstackPost",
          params: [params.message, params.scheduleSeconds, params.autoCloseTab],
        };

        // Send message to extension
        await sendExtensionMessage(message);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(SubstackError.UNKNOWN_ERROR);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sendExtensionMessage],
  );

  const pingExtension = useCallback(async () => {
    // const message: ExtensionMessage = {
    //   type: "PING",
    // };
    // await sendExtensionMessage(message);
    try {
      const response = await axios.post(
        "https://substack.com/api/v1/comment/feed",
        {
          headers: {
            "content-type": "application/json",
            Referer: "https://substack.com/home",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
          body: '{"bodyJson":{"type":"doc","attrs":{"schemaVersion":"v1"},"content":[{"type":"paragraph","content":[{"type":"text","text":"test"}]}]},"tabId":"for-you","surface":"feed","replyMinimumRole":"everyone"}',
        },
      );
      debugger;
      console.log("response", response);
    } catch (error) {
      console.error("error", error);
    }
  }, [sendExtensionMessage]);

  return {
    pingExtension,
    createPost,
    isLoading,
    error,
  };
}
