import { RouteBody } from "@/lib/api/api";
import { ApiRoute } from "@/lib/api/api";
import { CreatePostResponse } from "@/types/createPostResponse";
import { AxiosRequestConfig } from "axios";
import { NoteDraft } from "@/types/note";
import { AxiosResponse } from "axios";
import {
  NoteStats,
  NoteWithEngagementStats,
  ReactionInterval,
} from "@/types/notes-stats";
import { AttachmentType } from "@prisma/client";

/**
 * Supported browser types
 */
export type BrowserType = "chrome" | "firefox" | "unknown";
export type CookieSameSite =
  | "no_restriction"
  | "lax"
  | "strict"
  | "unspecified";
export type CookieName = "substack.sid" | "substack.lli" | "__cf_bm";
/**
 * Parameters for creating a Substack post
 */
export interface CreatePostParams {
  /** The content of the post */
  message: string;
  bodyJson?: string;
  /** Optional: Move note to status "published" */
  moveNoteToPublished?: {
    noteId: string;
  };
  attachments?: {
    url: string;
    type: AttachmentType;
  }[];
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
 * Schedule data interface
 */
export interface Schedule {
  scheduleId: string;
  userId: string;
  timestamp: number;
}

export interface Alarm {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number | undefined;
}

export interface GetSchedulesResponse {
  schedules: Schedule[];
  alarms: Alarm[];
}

/**
 * Message to send to the extension
 */
export interface ExtensionMessage {
  type: "API_REQUEST" | "PING";
  action?:
    | "createSubstackPost"
    | "getSubstackCookies"
    | "createSchedule"
    | "deleteSchedule"
    | "getSchedules"
    | "setNotesStats"
    | "getNotesStats"
    | "getNotesWithStatsForDate"
    | "verifyKey"
    | "updateExtensionDataInDB";
  params?: any[];
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
export interface UseExtension {
  isLoading: boolean;
  error: string | null;
  postResponse: CreatePostResponse | null;
  canUseSubstackPost: boolean;
  browserType: BrowserType;
  getNoteById: (noteId: string) => NoteDraft | null;
  setUserSubstackCookies: () => Promise<void>;
  hasExtension: (options?: {
    showDialog?: boolean;
    throwIfNoExtension?: boolean;
  }) => Promise<boolean>;
  sendNote: (params: CreatePostParams) => Promise<CreatePostResponse | null>;
  createSchedule: (schedule: {
    scheduleId: string;
    userId: string;
    noteId: string;
    timestamp: number;
  }) => Promise<Schedule | null>;
  deleteSchedule: (scheduleId: string) => Promise<boolean>;
  getSchedules: () => Promise<GetSchedulesResponse>;
  verifyExtension: () => Promise<{
    message: "success" | "error" | "pending" | "outdated";
    version?: string;
    date?: number;
  }>;
  updateNotesStatistics: () => Promise<any>;
  getNotesStatistics: (interval: ReactionInterval) => Promise<NoteStats | null>;
  getNotesWithStatsForDate: (
    date: string,
    options?: {
      orderBy?: string;
      orderDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
    },
  ) => Promise<NoteWithEngagementStats[]>;
  verifyExtensionKey: () => Promise<boolean>;
  updateExtensionData: () => Promise<boolean>;
}
