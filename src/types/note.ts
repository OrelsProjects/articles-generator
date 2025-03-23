import { marked } from "marked";
import { DateRange } from "react-day-picker";



export interface InspirationFilters {
  minLikes?: number | null;
  minComments?: number | null;
  minRestacks?: number | null;
  keyword?: string | null;
  dateRange?: DateRange;
  type: "all" | "relevant-to-user"
}

export type NoteStatus = "draft" | "ready" | "published";
export type NoteFeedback = "dislike" | "like";

export type JsonBody = {
  type: string;
  content: {
    text: string;
    type: string;
  }[];
};

export interface NoteDraft {
  id: string;
  thumbnail?: string;
  body: string;
  jsonBody?: any[];
  timestamp: Date;
  authorId: number | null;
  name?: string;
  handle?: string;
  status: NoteStatus;
  feedback?: NoteFeedback;
  feedbackComment?: string;
  authorName: string;
  attachments?: string[];
  isArchived?: boolean;
}

export interface Note {
  id: string;
  entityKey: string;
  content: string;
  thumbnail?: string;
  body: string;
  jsonBody: any[];
  timestamp: Date;
  authorId: number;
  authorName: string;
  handle: string;
  reactionCount: number;
  commentsCount: number;
  restacks: number;
  attachments?: string[];
}

function convertJsonToMarkdown(json: any): string {
  // Recursive helper to process each node.
  function processNode(node: any): string {
    if (!node) return "";

    switch (node.type) {
      case "doc":
        return (node.content || []).map(processNode).join("\n\n");
      case "paragraph":
        return (node.content || []).map(processNode).join("");
      case "text": {
        let text = node.text || "";
        if (node.marks && Array.isArray(node.marks)) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case "bold":
                text = `**${text}**`;
                break;
              case "italic":
                text = `*${text}*`;
                break;
              case "link": {
                const href =
                  mark.attrs && mark.attrs.href ? mark.attrs.href : "";
                text = `[${text}](${href})`;
                break;
              }
              default:
                // Unknown mark, just ignore.
                break;
            }
          });
        }
        return text;
      }
      case "orderedList":
        return (node.content || [])
          .map((child: any, index: number) => {
            // Use index+1 for numbering.
            return `${index + 1}. ${processNode(child)}`;
          })
          .join("\n");
      case "bulletList":
        return (node.content || [])
          .map((child: any) => `- ${processNode(child)}`)
          .join("\n");
      case "listItem":
        return (node.content || []).map(processNode).join("");
      default:
        // Fallback: if the node has content, process it; otherwise, output any text.
        return node.content
          ? node.content.map(processNode).join("")
          : node.text || "";
    }
  }

  return processNode(json);
}

export async function convertMDToHtml(md: string) {
  marked.setOptions({
    breaks: true, // Enable line breaks
    gfm: true, // Enable GitHub Flavored Markdown
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

export function noteToNoteDraft(note: Note | null): NoteDraft | null {
  if (!note) {
    return null;
  }

  return {
    id: "",
    thumbnail: "",
    body: note.body,
    jsonBody: note.jsonBody,
    timestamp: new Date(),
    authorId: null,
    status: "draft",
    authorName: "",
    attachments: note.attachments ? note.attachments : [],
  };
}
