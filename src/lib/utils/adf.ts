import { MarkdownTransformer } from "@atlaskit/editor-markdown-transformer";

function formatBlockquotes(markdown: string): string {
  const lines = markdown.split("\n");
  let inBlockquote = false;
  const result: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith(":::blockquote")) {
      inBlockquote = true;
      const contentAfterTag = trimmed.replace(":::blockquote", "").trim();
      if (contentAfterTag) result.push(`> ${contentAfterTag}`);
      continue;
    }

    // If we're inside a blockquote and this line has ::: anywhere, cut it
    if (inBlockquote && trimmed.includes(":::")) {
      const beforeEnd = line.split(":::")[0].trim();
      if (beforeEnd) {
        result.push(`> ${beforeEnd}`);
      }
      inBlockquote = false;
      continue;
    }

    if (inBlockquote) {
      result.push(`> ${line}`);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

export async function markdownToADF(markdown: string) {
  const formattedMarkdown = formatBlockquotes(markdown);
  const transformer = new MarkdownTransformer();
  const rawADF = transformer.parse(formattedMarkdown);

  // This part is key — ProseMirror might return Fragment-like structures
  const contentArray = Array.isArray(rawADF.content)
    ? rawADF.content
    : rawADF.content?.toJSON?.() ?? [];

  const cleanADF = {
    type: "doc",
    attrs: {
      schemaVersion: "v1",
    },
    content: transformContent(contentArray),
  };

  return cleanADF;
}

function transformContent(content: any[]): any[] {
  return content.map(node => {
    if (!node || typeof node !== "object") return node;

    const newNode = { ...node };

    // Fix nested attrs
    if (newNode.attrs) {
      delete newNode.attrs.localId;
      if (Object.keys(newNode.attrs).length === 0) delete newNode.attrs;
    }

    // Recursively transform children
    if (newNode.content) {
      const nested = Array.isArray(newNode.content)
        ? newNode.content
        : newNode.content?.toJSON?.() ?? [];
      newNode.content = transformContent(nested);
    }

    // Convert marks
    if (newNode.marks) {
      newNode.marks = newNode.marks.map((mark: any) => {
        if (mark.type === "strong") mark.type = "bold";
        if (mark.type === "em") mark.type = "italic";
        return mark;
      });
    }

    // Fix ordered list attrs
    if (newNode.type === "orderedList" && newNode.attrs?.order) {
      newNode.attrs.start = newNode.attrs.order;
      delete newNode.attrs.order;
    }

    return newNode;
  });
}

export interface ADFNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ADFNode[];
  text?: string;
  marks?: { type: string }[];
}

// Helper to recursively transform children
function transformChildren(
  children: any[],
  parentMarks: { type: string }[] = [],
): ADFNode[] {
  return children
    .map(child => transformNode(child, parentMarks))
    .filter(Boolean) as ADFNode[];
}

export function transformNode(
  node: any,
  parentMarks: { type: string }[] = [],
): ADFNode | null {
  switch (node.type) {
    // ─────────────────────────────────────────────────────────────────────
    // ROOT => produce the final Doc node
    // ─────────────────────────────────────────────────────────────────────
    case "root":
      return {
        type: "doc",
        attrs: { schemaVersion: "v1" },
        content: transformChildren(node.children, parentMarks),
      };

    // ─────────────────────────────────────────────────────────────────────
    // PARAGRAPH => becomes ADF paragraph
    // ─────────────────────────────────────────────────────────────────────
    case "paragraph":
      return {
        type: "paragraph",
        content: transformChildren(node.children, parentMarks),
      };

    case "blockquote":
      return {
        type: "blockquote",
        content: transformChildren(node.children, parentMarks),
      };

    // ─────────────────────────────────────────────────────────────────────
    // TEXT => produce a simple text node with any inherited marks
    // ─────────────────────────────────────────────────────────────────────
    case "text":
      // Handle explicit newlines in the text content
      if (node.value && node.value.includes("\n")) {
        // Split text by newlines and create alternating text and hardBreak nodes
        const parts = node.value.split("\n");
        const content: ADFNode[] = [];

        parts.forEach((part: string, index: number) => {
          // Add text node
          if (part) {
            content.push({
              type: "text",
              text: part,
              ...(parentMarks.length ? { marks: parentMarks } : {}),
            });
          }

          // Add hard break after each part except the last one
          if (index < parts.length - 1) {
            content.push({
              type: "hardBreak",
            });
          }
        });

        return {
          type: "paragraph",
          content,
        };
      }

      return {
        type: "text",
        text: node.value || "",
        ...(parentMarks.length ? { marks: parentMarks } : {}),
      };

    // ─────────────────────────────────────────────────────────────────────
    // STRONG (bold) => add a "bold" mark and recurse children
    // ─────────────────────────────────────────────────────────────────────
    case "strong": {
      const newMarks = [...parentMarks, { type: "bold" }];
      // strong nodes typically have children which are text or emphasis combos
      // we flatten them into a single array
      return {
        type: "paragraph", // or "text" if you want just a single text node
        content: transformChildren(node.children, newMarks),
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // EMPHASIS (italic) => add an "italic" mark and recurse
    // ─────────────────────────────────────────────────────────────────────
    case "emphasis": {
      const newMarks = [...parentMarks, { type: "italic" }];
      return {
        type: "paragraph",
        content: transformChildren(node.children, newMarks),
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE (~~strikethrough~~) => add a "strike" mark
    // ─────────────────────────────────────────────────────────────────────
    case "delete": {
      const newMarks = [...parentMarks, { type: "strike" }];
      return {
        type: "paragraph",
        content: transformChildren(node.children, newMarks),
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // INLINE CODE => produce a text node with a { type: "code" } mark
    // ─────────────────────────────────────────────────────────────────────
    case "inlineCode": {
      const newMarks = [...parentMarks, { type: "code" }];
      return {
        type: "text",
        text: node.value || "",
        marks: newMarks,
      };
    }

    case "heading": {
      // unified/remark uses `.depth`; Atlassian uses attrs.level – cover both
      const level = node.depth ?? node.attrs?.level ?? 1;
      return {
        type: "heading",
        attrs: { level },
        content: transformChildren(node.children, parentMarks),
      };
    }
    // ─────────────────────────────────────────────────────────────────────
    // CODE BLOCK => multi-line code fences
    // We'll produce a "codeBlock" node. If you prefer a "paragraph" node
    // with code marks, do that instead.
    // ─────────────────────────────────────────────────────────────────────
    case "code": {
      // If you only want an inline code approach, you can:
      // return {
      //   type: 'text',
      //   text: node.value || '',
      //   marks: [...parentMarks, { type: 'code' }]
      // };
      return {
        type: "codeBlock",
        // you can store language in 'attrs.language' if node.lang is set
        attrs: { language: node.lang || "" },
        content: [
          {
            type: "text",
            text: node.value || "",
          },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // BREAK (br, hard line break) => convert to hardBreak node
    // ─────────────────────────────────────────────────────────────────────
    case "break":
      return {
        type: "hardBreak",
      };

    // ─────────────────────────────────────────────────────────────────────
    // LIST (ordered/unordered)
    // bulletList => { type: "bulletList", content: [listItem, ...] }
    // orderedList => { type: "orderedList", attrs: { start }, content: [listItem, ...] }
    // ─────────────────────────────────────────────────────────────────────
    case "list": {
      if (node.ordered) {
        return {
          type: "orderedList",
          attrs: { start: typeof node.start === "number" ? node.start : 1 },
          content: transformChildren(node.children, parentMarks),
        };
      }
      return {
        type: "bulletList",
        content: transformChildren(node.children, parentMarks),
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // LIST ITEM => { type: "listItem", content: ... } with possible nested lists
    // ─────────────────────────────────────────────────────────────────────
    case "listItem": {
      return {
        type: "listItem",
        content: transformChildren(node.children, parentMarks),
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // FALLBACK => ignore anything not explicitly handled
    // ─────────────────────────────────────────────────────────────────────
    default:
      // If you want to see what's unhandled:
      // console.log('Unhandled node.type:', node.type, node);
      return null;
  }
}
