import { marked } from "marked";
import TurndownService from "turndown";

import { DOMSerializer } from "@tiptap/pm/model";
import { Editor, Extension, UseEditorOptions } from "@tiptap/react";
import { InputRule, Node } from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Heading from "@tiptap/extension-heading";
import { HardBreak } from "@tiptap/extension-hard-break";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CodeBlock from "@tiptap/extension-code-block";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { cn } from "@/lib/utils";
import { Lora } from "@/lib/utils/fonts";
import Blockquote from "@tiptap/extension-blockquote";
import { Plugin, PluginKey } from "prosemirror-state";
import ResizableImageExtension from "@/components/ui/extenstions/ResizeImage";
import { Decoration, DecorationSet } from "prosemirror-view";

export function getSelectedContentAsMarkdown(editor: Editor): string {
  const selectedHTML = getSelectedContentAsHTML(editor);
  if (!selectedHTML) return "";

  return unformatText(selectedHTML);
}

export function getSelectedContentAsHTML(editor: Editor) {
  const { state } = editor;
  const { from, to } = state.selection;

  if (from === to) {
    // Nothing selected
    return "";
  }

  const slice = state.doc.slice(from, to);

  // Use ProseMirror's DOMSerializer
  const div = document.createElement("div");
  const serializer = DOMSerializer.fromSchema(editor.schema);
  div.appendChild(serializer.serializeFragment(slice.content));

  return div.innerHTML;
}

// Convert HTML → Markdown properly
export const unformatText = (html: string): string => {
  if (!html) return "";

  // Clean up any potential double spaces or unnecessary newlines
  const cleanHtml = html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

  return turndownService.turndown(cleanHtml);
};

export const formatText = (text: string): string => {
  if (text === "") return "";

  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  // Handle custom image dimensions before passing to marked
  text = text.replace(
    /!\[(.*?)\]\((.*?)\){width=(\d+)}/g,
    (_, alt, src, width) =>
      `<img src="${src}" alt="${alt}" width="${width}" />`,
  );

  return marked(text) as string;
};

export const formatSpecialFormats = (text: string): string => {
  if (text === "") return "";
  const regexPullquote =
    /(?:<p>)?:::pullquote[A-Za-z]*?\s*([\s\S]*?)\s*:::(?:<\/p>)?/g;
  const regexBlockquote =
    /(?:<p>)?:::blockquote[A-Za-z]*?\s*([\s\S]*?)\s*:::(?:<\/p>)?/g;

  const quotes: { type: string; content: string }[] = [];

  // Extract pullquotes with better whitespace handling
  text = text.replace(regexPullquote, (match, content, offset, string) => {
    quotes.push({ type: "pullquote", content: content.trim() });
    // Check if we need to preserve a newline
    const needsNewline = string[offset + match.length] === "\n" ? "\n" : "";
    return `###PULLQUOTE${quotes.length - 1}###${needsNewline}`;
  });

  // Extract blockquotes with better whitespace handling
  text = text.replace(regexBlockquote, (match, content, offset, string) => {
    quotes.push({ type: "blockquote", content: content.trim() });
    // Check if we need to preserve a newline
    const needsNewline = string[offset + match.length] === "\n" ? "\n" : "";
    return `###BLOCKQUOTE${quotes.length - 1}###${needsNewline}`;
  });

  // Replace quote placeholders with formatted HTML, preserving only necessary whitespace
  quotes.forEach((quote, index) => {
    const formattedContent = formatText(quote.content);
    if (quote.type === "pullquote") {
      text = text.replace(
        `###PULLQUOTE${index}###`,
        `<div class="pullquote">${formattedContent}</div>`,
      );
    } else {
      text = text.replace(
        `###BLOCKQUOTE${index}###`,
        `<blockquote>${formattedContent}</blockquote>`,
      );
    }
  });

  // Clean up any potential double newlines
  return text.replace(/\n{3,}/g, "\n\n");
};

const turndownService = new TurndownService({
  headingStyle: "atx", // Converts headings into `#`, `##`, etc.
  codeBlockStyle: "fenced", // Ensures code blocks use triple backticks
  strongDelimiter: "**",
  emDelimiter: "*",
  bulletListMarker: "*",
});

// Custom rules for improved Markdown output
turndownService.addRule("heading", {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function (content, node) {
    const level = Number(node.nodeName.charAt(1));
    return `\n${"#".repeat(level)} ${content}\n`;
  },
});

// Add this to where turndownService is configured
turndownService.addRule("images", {
  filter: "img",
  replacement: function (content, node: any) {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    const width = node.getAttribute("width") || "";
    const height = node.getAttribute("height") || "";
    // Include width and height in the markdown if they exist
    const dimensions = width ? `{width=${width}}` : "";
    return `![${alt}](${src})${dimensions}`;
  },
});

// Add custom rules for quotes
turndownService.addRule("blockquote", {
  filter: "blockquote",
  replacement: function (content, node) {
    // Clean up newlines and spaces while preserving content structure
    const cleanContent = content.replace(/\n+/g, "\n").trim();
    return `:::blockquote${cleanContent}:::`;
  },
});

turndownService.addRule("pullquote", {
  filter: node =>
    node.nodeName === "DIV" && node.classList.contains("pullquote"),
  replacement: function (content, node) {
    // Clean up newlines and spaces while preserving content structure
    const cleanContent = content.replace(/\n+/g, "\n").trim();
    return `:::pullquote${cleanContent}:::`;
  },
});

// A custom extension to map Enter key inside code blocks.
const CustomKeymap = Extension.create({
  name: "customKeymap",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.newlineInCode(),
    };
  },
});

const CustomImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      class: { default: "rounded-md max-w-full h-auto" },
      contenteditable: { default: "false" },
      draggable: { default: "true" },
    };
  },
});

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    switch (node.attrs.level) {
      case 1:
        return [
          "h1",
          {
            ...HTMLAttributes,
            class:
              "text-text-editor-h1 mt-[1em] mb-[0.625em] font-bold !font-sans",
          },
          0,
        ];
      case 2:
        return [
          "h2",
          {
            ...HTMLAttributes,
            class:
              "text-text-editor-h2 mt-[1em] mb-[0.625em] font-bold !font-sans",
          },
          0,
        ];
      case 3:
        return [
          "h3",
          {
            ...HTMLAttributes,
            class:
              "text-text-editor-h3 mt-[1em] mb-[0.625em] font-bold !font-sans",
          },
          0,
        ];
      case 4:
        return [
          "h4",
          {
            ...HTMLAttributes,
            class:
              "text-text-editor-h4 mt-[1em] mb-[0.625em] font-bold !font-sans",
          },
          0,
        ];
      case 5:
        return [
          "h5",
          {
            ...HTMLAttributes,
            class: "text-text-editor-h5 mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 6:
        return [
          "h6",
          {
            ...HTMLAttributes,
            class: "text-text-editor-h6 mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      default:
        return ["h" + node.attrs.level, HTMLAttributes, 0];
    }
  },
});

// Add custom blockquote with styling
const CustomBlockquote = Blockquote.extend({
  parseHTML() {
    return [{ tag: "blockquote" }];
  },
  renderHTML() {
    return ["blockquote", { class: "blockquote" }, 0];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          // Prevent empty paragraph insertion before blockquotes
          return null;
        },
      }),
    ];
  },
});

// Add new PullQuote node
const PullQuote = Node.create({
  name: "pullquote",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: "div.pullquote" }];
  },

  renderHTML() {
    return ["div", { class: "pullquote " + Lora.className }, 0];
  },
});

// Add this before textEditorOptions
const LoadingDecoration = Extension.create({
  name: "loadingDecoration",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: state => {
            const { loadingImprovement } = this.editor.storage;
            if (!loadingImprovement?.text) return DecorationSet.empty;

            const { from, to } = loadingImprovement.text;
            return DecorationSet.create(state.doc, [
              Decoration.inline(
                from,
                to,
                {
                  class: "loading-text",
                },
                { class: "loading-text-wrapper" },
              ),
            ]);
          },
          handleDOMEvents: {
            mouseover: (view, event) => {
              const target = event.target as HTMLElement;
              if (target.classList.contains("loading-text")) {
                target.style.opacity = "0.5";
                return true;
              }
              return false;
            },
            mouseout: (view, event) => {
              const target = event.target as HTMLElement;
              if (target.classList.contains("loading-text")) {
                target.style.opacity = "1";
                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
  addStorage() {
    return {
      loadingImprovement: null,
    };
  },
});

export const skeletonPluginKey = new PluginKey("skeletonPlugin");

// 2) Create the plugin that holds a DecorationSet
const SkeletonPlugin = Extension.create({
  name: "skeleton",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: skeletonPluginKey,

        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldDecoSet) {
            let decoSet = oldDecoSet.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(skeletonPluginKey);
            if (meta && meta.add) {
              decoSet = decoSet.add(tr.doc, meta.add);
            }
            return decoSet;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

// export const HardBreakButNotInList = HardBreak.extend({
//   // Let the extension know we want to keep marks on a hard break
//   addOptions() {
//     return {
//       ...this.parent?.(),
//       keepMarks: true,
//     };
//   },

//   addKeyboardShortcuts() {
//     return {
//       "Shift-Enter": () => {
//         // If we're in a bullet list or ordered list, block the break
//         if (
//           this.editor.isActive("bulletList") ||
//           this.editor.isActive("orderedList")
//         ) {
//           return true; // "true" = do nothing
//         }
//         // Otherwise, call setHardBreak with no arguments
//         return this.editor.commands.setHardBreak();
//       },
//     };
//   },
// });

// Allow bold/italic/underline/strikethrough/code/list (numbers/dots)/blockquote
// <p> has margin top-bottom of 6px.
// images
// Nothing else.
export const ArrowLigature = Extension.create({
  name: "arrowLigature",

  addInputRules() {
    // Trigger on `->`
    const arrowRule = new InputRule({
      find: /->$/,
      handler: ({ state, match, range }) => {
        if (match[0]) {
          state.tr.insertText("→", range.from, range.to);
        }
      }
    });

    return [arrowRule];
  },
});

export const notesTextEditorOptions = (
  onUpdate?: (html: string) => void,
  options: {
    disabled?: boolean;
    disabledClass?: string;
  } = {},
): UseEditorOptions => ({
  onUpdate: ({ editor }) => {
    let html = editor.getHTML();
    html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    onUpdate?.(html);
  },
  editable: !options.disabled,
  extensions: [
    StarterKit.configure({
      hardBreak: false,
      paragraph: {
        HTMLAttributes: { class: cn("mb-5 leading-8", Lora.className) },
      },
      horizontalRule: false,
    }),
    SkeletonPlugin,
    BulletList,
    ListItem,
    Document,
    CustomBlockquote,
    CodeBlock,
    ArrowLigature,
    Paragraph.configure({
      HTMLAttributes: { class: "my-3" },
    }),
    Text,
    Link.configure({
      HTMLAttributes: {
        class:
          "text-primary underline underline-offset-4 hover:text-primary/80",
      },
    }),
    Placeholder.configure({
      placeholder: options.disabled ? "" : "What's on your mind?",
    }),
  ],
  editorProps: {
    attributes: {
      class: cn(
        "prose prose-sm max-w-none focus:outline-none transition-opacity",
        options.disabled
          ? options.disabledClass
            ? options.disabledClass
            : "opacity-50 cursor-not-allowed"
          : "",
      ),
    },
  },
});

export const textEditorOptions = (
  onUpdate?: (html: string) => void,
  onSelectionUpdate?: (text: string) => void,
  disabled?: boolean,
): UseEditorOptions => ({
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    onUpdate?.(html);
  },
  onSelectionUpdate: ({ editor }) => {
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(selection.from, selection.to);
    onSelectionUpdate?.(text);
  },
  editable: !disabled,
  extensions: [
    StarterKit.configure({
      paragraph: {
        HTMLAttributes: { class: cn("mb-5 leading-8", Lora.className) },
      },
    }),
    Document,
    Paragraph.configure({
      HTMLAttributes: { class: cn("mb-5 leading-8", Lora.className) },
    }),
    Text,
    BulletList,
    ListItem,
    CustomHeading,
    CustomKeymap,
    CustomHeading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    CustomImage.configure({ inline: true }),
    Link,
    Subscript,
    Superscript,
    CodeBlock,
    BubbleMenu.configure({
      shouldShow: ({ editor, view, state, oldState, from, to }) => {
        // only show the bubble menu if not image
        return !editor.isActive("image");
      },
    }),
    Placeholder.configure({
      placeholder: "Start writing...",
    }),
    SkeletonNode,
    CustomBlockquote,
    PullQuote,
    // make sure the image is always centered
    ResizableImageExtension,
    LoadingDecoration,
  ],
  content: "",
  editorProps: {
    attributes: {
      id: "text-editor-tiptap",
      class: "prose prose-lg mx-auto focus:outline-none h-full text-xl",
    },
    handleDrop: (view, event, slice, moved) => {
      if (moved || !event.dataTransfer) return false;
      // Let the default handler deal with it
      return false;
    },
  },
});

export const SkeletonNode = Node.create({
  name: "skeleton",
  group: "block",
  inline: false,
  atom: true,

  renderHTML() {
    return [
      "div",
      {
        class:
          "w-full flex justify-center skeleton-placeholder my-4 flex items-center gap-4",
      },
      [
        "div",
        { class: "w-[420px] h-[300px] bg-gray-200 animate-pulse rounded-md" },
      ],
    ];
  },
});

export const loadContent = (markdownContent: string, editor: Editor | null) => {
  let formattedContent = formatText(markdownContent);
  let contentWithSpecialFormats = formatSpecialFormats(formattedContent);
  // Clean up empty paragraphs with trailing breaks before quotes
  let cleanedHtml = contentWithSpecialFormats.replace(
    /<br\s*class=["']ProseMirror-trailingBreak["']\s*\/?>/g,
    "",
  );

  editor?.commands.setContent(cleanedHtml);
};
