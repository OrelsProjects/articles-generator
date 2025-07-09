import { NoteDraft, NoteDraftBody, NoteStatus } from "@/types/note";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";
import { Logger } from "@/logger";
import axiosInstance from "@/lib/axios-instance";

export async function createNoteDraft(
  note: {
    body: string;
    status: NoteStatus;
    bodyJson?: string;
    clientId?: string;
  },
  config?: AxiosRequestConfig,
) {
  const response = await axiosInstance.post<NoteDraft>("/api/note", note, {
    ...config,
  });
  return response.data;
}

export async function updateNoteDraft(
  id: string,
  partialNote: Partial<NoteDraftBody>,
  config: AxiosRequestConfig,
) {
  await axiosInstance.patch<NoteDraft[]>(`/api/note/${id}`, partialNote, {
    ...config,
  });
}

export async function getSubstackCookiesExpiration(
  config?: AxiosRequestConfig,
): Promise<{ valid: boolean; expiresAt: Date }> {
  try {
    const response = await axiosInstance.post<{
      valid: boolean;
      expiresAt: Date;
    }>("/api/user/cookies/is-valid", {}, { ...(config || {}) });
    return response.data;
  } catch (error) {
    throw new Error("Failed to get substack cookies expiration");
  }
}

// COOKIES-REQUIRED
const ROUTES = ["schedule", "schedule-delete", "send"];

interface RouteBodyTypes {
  schedule: {
    date: string;
  };
  "schedule-delete": Record<string, never>;
  send: {
    noteId: string;
    userId: string;
  };
}

// Define route schemas using Zod
export const routeSchemas = {
  schedule: z.object({
    date: z.date(),
    noteId: z.string(),
  }),
  "schedule-delete": z.object({
    noteId: z.string(),
    status: z.string().optional(),
  }),
  send: z.object({
    noteId: z.string(),
    userId: z.string(),
  }),
} as const;

// Type for valid routes
export type ApiRoute = (typeof ROUTES)[number];

// Type for route-specific request bodies
export type RouteBody<T extends ApiRoute> = T extends keyof typeof routeSchemas
  ? z.infer<(typeof routeSchemas)[T]>
  : never;

/**
 * Generic API request function with validation and authentication
 * @param route - API route to call
 * @param body - Request body (will be validated against schema)
 * @param config - Optional Axios request configuration
 * @returns Promise with the API response
 */
export async function extensionApiRequest<T extends ApiRoute, R = any>(
  route: T,
  body: RouteBody<T>,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<R>> {
  try {
    // 2. Validate request body against schema
    if (route in routeSchemas) {
      const schema = routeSchemas[route as keyof typeof routeSchemas];
      try {
        schema.parse(body);
      } catch (err) {
        const error = err as Error;
        Logger.error(
          `Validation error for ${route}: ${error.message || "Unknown validation error"}`,
        );
        throw new Error(`Invalid request body for ${route}`);
      }
    } else {
      throw new Error(`Unknown route: ${route}`);
    }

    // 3. Determine endpoint and method based on route
    let endpoint = `/api/user/notes/${route}`;
    let method: AxiosRequestConfig["method"] = "post";

    switch (route) {
      case "schedule-delete":
        method = "delete";
        endpoint = `/api/user/notes/${body.noteId}/schedule`;
        if ("status" in body && body.status) {
          endpoint += `?status=${body.status}`;
        }
        break;
      case "schedule":
        method = "post";
        endpoint = `/api/user/notes/${body.noteId}/schedule`;
        break;
      case "send":
        method = "post";
        endpoint = `/api/user/notes/send`;
        break;
    }

    // set body only for methods: post, put, patch
    let data = undefined;
    if (method === "post" || method === "put" || method === "patch") {
      data = body;
    }

    return await axiosInstance({
      url: endpoint,
      method,
      data,
      ...(config || {}),
    });
  } catch (err) {
    const error = err as Error;
    Logger.error(
      `API request failed for ${route}: ${error.message || "Unknown error"}`,
    );
    throw error;
  }
}

// Example usage:
// const response = await apiRequest('schedule', { date: '2023-05-01T10:00:00Z' });
// const deleteResponse = await apiRequest('schedule-delete', {});
// const sendResponse = await apiRequest('send', { noteId: '123', userId: '456' });
