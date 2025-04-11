import { marked } from "marked";
import { DateRange } from "react-day-picker";

export type NoteId = string;

export interface InspirationFilters {
  minLikes?: number | null;
  minComments?: number | null;
  minRestacks?: number | null;
  keyword?: string | null;
  dateRange?: DateRange;
  type: "all" | "relevant-to-user";
}

export type InspirationSortType =
  | "relevance"
  | "date"
  | "likes"
  | "comments"
  | "restacks";
export type InspirationSortDirection = "asc" | "desc";

export const inspirationSortTypeToName = {
  relevance: "Relevance",
  date: "Date",
  likes: "Most Liked",
  comments: "Most Commented",
  restacks: "Most Restacked",
};

export interface InspirationSort {
  type: InspirationSortType;
  direction: InspirationSortDirection;
}

export type NoteStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "published"
  | "failed";
export type NoteFeedback = "dislike" | "like";

export type JsonBody = {
  type: string;
  content: {
    text: string;
    type: string;
  }[];
};

export interface SubstackImageResponse {
  id: string;
  type: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  explicit: boolean;
}

export interface NoteDraftImage {
  id: string;
  url: string;
  // width: number;
  // height: number;
}

export interface NoteDraft {
  id: NoteId;
  thumbnail?: string;
  body: string;
  jsonBody?: any[];
  createdAt: Date;
  authorId: number | null;
  name?: string;
  handle?: string;
  status: NoteStatus | "inspiration";
  feedback?: NoteFeedback;
  feedbackComment?: string;
  authorName: string;
  isArchived?: boolean;
  scheduledTo?: Date | null;
  wasSentViaSchedule: boolean;
  attachments?: NoteDraftImage[] | null;
}

export interface NoteDraftBody extends Omit<NoteDraft, "status"> {
  status: NoteStatus;
}

export interface Note {
  id: NoteId;
  entityKey: string;
  content: string;
  thumbnail?: string;
  body: string;
  jsonBody: any[];
  createdAt: Date;
  authorId: number;
  authorName: string;
  handle: string;
  reactionCount: number;
  commentsCount: number;
  restacks: number;
  attachments?: string[];
  attachment?: string;
  scheduledTo?: Date | null;
  sentViaScheduleAt?: boolean;
}

export interface DBNote {
  id: string;
  comment_id: string;
  type: string;
  user_id: number;
  body: string;
  body_json: any[];
  date: Date;
  handle: string;
  name: string;
  photo_url: string;
  reaction_count: number;
  restacks: number;
  restacked: boolean;
  context_type: string;
  entity_key: string;
  note_is_restacked: boolean;
  children_count: number;
  timestamp: Date;
}

export interface InspirationNote extends Note {
  score: number;
}

export async function convertMDToHtml(md: string) {
  marked.setOptions({
    breaks: true, // Enable line breaks
    // gfm: true, // Enable GitHub Flavored Markdown
  });

  // Replace arrow characters with HTML entities
  const processedMd = md.replace(/→/g, "&rarr;");

  return marked.parse(processedMd);
}

// Function to convert a JSON rich text structure to HTML
export function convertJsonToHtml(json: any): string {
  // Recursive helper to process each node
  function processNode(node: any): string {
    if (!node) return "";

    switch (node.type) {
      case "doc":
        // Process the document's children without additional wrapping
        return (node.content || []).map(processNode).join("");
      case "paragraph":
        // Wrap paragraph content in <p> tags
        return `<p class="mb-4">${(node.content || []).map(processNode).join("")}</p>`;
      case "text": {
        let text = node.text || "";
        // Process text marks like bold, italic, or link
        if (node.marks && Array.isArray(node.marks)) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case "bold":
                text = `<strong>${text}</strong>`;
                break;
              case "italic":
                text = `<em>${text}</em>`;
                break;
              case "link": {
                const href =
                  mark.attrs && mark.attrs.href ? mark.attrs.href : "#";
                text = `<a href="${href}">${text}</a>`;
                break;
              }
              default:
                // Unsupported mark types can be ignored or handled here
                break;
            }
          });
        }
        return text;
      }
      case "orderedList":
        return `<ol>${(node.content || []).map(processNode).join("")}</ol>`;
      case "bulletList":
        return `<ul>${(node.content || []).map(processNode).join("")}</ul>`;
      case "listItem":
        return `<li>${(node.content || []).map(processNode).join("")}</li>`;
      default:
        // Fallback for unhandled node types
        return node.content
          ? node.content.map(processNode).join("")
          : node.text || "";
    }
  }
  return processNode(json);
}

export function isNoteDraft(note: Note | NoteDraft | null): NoteDraft | null {
  return !note?.hasOwnProperty("reactionCount") ? (note as NoteDraft) : null;
}

export function inspirationNoteToNoteDraft(
  note: Note | null,
): NoteDraft | null {
  if (!note) {
    return null;
  }

  const attachment = note.attachments?.pop() || note.attachment;
  return {
    id: "",
    thumbnail: "",
    body: note.body,
    jsonBody: note.jsonBody,
    createdAt: new Date(),
    authorId: null,
    status: "inspiration",
    authorName: "",
    scheduledTo: note.scheduledTo,
    wasSentViaSchedule: !!note.sentViaScheduleAt,
    attachments: attachment
      ? [
          {
            id: "",
            url: attachment,
          },
        ]
      : [],
  };
}

export const NOTE_EMPTY_ID = "empty";

export const isEmptyNote = (note: NoteDraft | Note | string | null) => {
  const id = typeof note === "string" ? note : note?.id;
  return !id || id === NOTE_EMPTY_ID;
};

export const NOTE_EMPTY: NoteDraft = {
  id: NOTE_EMPTY_ID,
  thumbnail: "",
  body: "",
  jsonBody: [],
  createdAt: new Date(),
  authorId: null,
  status: "draft",
  authorName: "",
  scheduledTo: null,
  wasSentViaSchedule: false,
  attachments: [],
};
