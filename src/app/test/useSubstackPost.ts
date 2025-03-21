"use client";

import { useState, useCallback } from "react";
import {
  CreatePostParams,
  ExtensionMessage,
  ExtensionResponse,
  SubstackError,
  UseSubstackPost,
} from "./types";

const EXTENSION_EVENT = 'substack-extension-message';
const EXTENSION_RESPONSE_EVENT = 'substack-extension-response';

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
        const handleResponse = (event: CustomEvent) => {
          window.removeEventListener(EXTENSION_RESPONSE_EVENT, handleResponse as EventListener);
          const response = event.detail as ExtensionResponse;
          
          if (!response.success) {
            reject(new Error(response.error || SubstackError.UNKNOWN_ERROR));
          } else {
            resolve(response);
          }
        };

        // Add listener for response
        window.addEventListener(EXTENSION_RESPONSE_EVENT, handleResponse as EventListener);

        // Send message to extension
        try {
          window.dispatchEvent(
            new CustomEvent(EXTENSION_EVENT, { detail: message })
          );
        } catch (error) {
          window.removeEventListener(EXTENSION_RESPONSE_EVENT, handleResponse as EventListener);
          reject(new Error(SubstackError.EXTENSION_NOT_FOUND));
        }

        // Set timeout for response
        setTimeout(() => {
          window.removeEventListener(EXTENSION_RESPONSE_EVENT, handleResponse as EventListener);
          reject(new Error(SubstackError.NETWORK_ERROR));
        }, 5000); // 5 second timeout
      });
    },
    []
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
    [sendExtensionMessage]
  );

  return {
    createPost,
    isLoading,
    error,
  };
}
