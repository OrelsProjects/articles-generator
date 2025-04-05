import { CreatePostResponse } from "@/types/createPostResponse";
import { NoteDraft } from "@/types/note";

/**
 * Supported browser types
 */
export type BrowserType = "chrome" | "firefox" | "unknown";
export type CookieSameSite = "no_restriction" | "lax" | "strict" | "unspecified";
export type CookieName = "substack.sid" | "substack.lli" | "__cf_bm";
/**
 * Parameters for creating a Substack post
 */
export interface CreatePostParams {
  /** The content of the post */
  message: string;
  /** Optional: Move note to status "published" */
  moveNoteToPublished?: {
    noteId: string;
  };
  /** Optional: Schedule post for future (in seconds) */
  scheduleSeconds?: number;
  /** Optional: Automatically close the tab after posting */
  autoCloseTab?: boolean;
}

/**
 * Response from the extension API
 */
export interface ExtensionResponse<T> {
  success: boolean;
  result?: T;
  message?: string;
  action?: string;
  error?: string;
}

// export interface GetSubstackCookiesResponse {
//   "substack.sid": string;
//   "substack.lli": string;
//   __cf_bm: string;
// }

export interface SubstackCookie {
  name: CookieName;
  value: string;
  expiresAt: number | null; // Unix timestamp in seconds
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: CookieSameSite;
}

export type GetSubstackCookiesResponse = SubstackCookie[];
/**
 * Message to send to the extension
 */
export interface ExtensionMessage {
  type: "API_REQUEST" | "PING";
  action?: "createSubstackPost" | "getSubstackCookies";
  params?: [any];
}

/**
 * Error types for Substack posting
 */
export enum SubstackError {
  EXTENSION_NOT_FOUND = "Extension not found",
  PENDING = "Pending",
  EXTENSION_DISABLED = "Extension is disabled",
  NETWORK_ERROR = "Network error occurred",
  AUTHENTICATION_ERROR = "Authentication failed",
  INVALID_PARAMETERS = "Invalid parameters provided",
  UNKNOWN_ERROR = "An unknown error occurred",
  BROWSER_NOT_SUPPORTED = "Browser not supported",
}

/**
 * Hook return type
 */
export interface UseSubstackPost {
  createNote: (params: CreatePostParams) => Promise<CreatePostResponse | null>;
  isLoading: boolean;
  error: string | null;
  postResponse: CreatePostResponse | null;
  canUseSubstackPost: boolean;
  browserType: BrowserType;
  getNoteById: (noteId: string) => NoteDraft | null;
  setUserSubstackCookies: () => Promise<void>;
}
