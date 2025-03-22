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

    // ─────────────────────────────────────────────────────────────────────
    // TEXT => produce a simple text node with any inherited marks
    // ─────────────────────────────────────────────────────────────────────
    case "text":
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
