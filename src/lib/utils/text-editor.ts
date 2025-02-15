import { marked } from "marked";
import TurndownService from "turndown";

import { DOMSerializer } from "@tiptap/pm/model";
import { Editor, Extension, UseEditorOptions } from "@tiptap/react";
import { Node } from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Heading from "@tiptap/extension-heading";
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
  return turndownService.turndown(html);
};

export const formatText = (text: string): string => {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const markedText = marked(text) as string;
  return markedText;
};

const turndownService = new TurndownService({
  headingStyle: "atx", // Converts headings into `#`, `##`, etc.
  codeBlockStyle: "fenced", // Ensures code blocks use triple backticks
});

// Custom rules for improved Markdown output
turndownService.addRule("headers", {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function (content, node) {
    const level = parseInt(node.nodeName.replace("H", ""), 10);
    return `${"#".repeat(level)} ${content}\n`;
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
  // make it centered horizontally
  parseHTML() {
    return [
      {
        tag: "img",
        getAttrs: dom => ({
          src: dom.getAttribute("src"),
          alt: dom.getAttribute("alt") || "",
          class: dom.getAttribute("class") || "rounded-md max-w-full h-auto",
          contenteditable: dom.getAttribute("contenteditable") || "false",
          draggable: dom.getAttribute("draggable") || "true",
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { style: "display: flex; justify-content: center;" }, // Centering the image
      ["img", HTMLAttributes],
    ];
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
            class: "text-text-editor-h1 mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 2:
        return [
          "h2",
          {
            ...HTMLAttributes,
            class: "text-text-editor-h2 mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 3:
        return [
          "h3",
          {
            ...HTMLAttributes,
            class: "text-text-editor-h3 mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 4:
        return [
          "h4",
          {
            ...HTMLAttributes,
            class: "text-text-editor-h4 mt-[1em] mb-[0.625em] font-bold",
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

export const textEditorOptions = (
  onUpdate?: (html: string) => void,
): UseEditorOptions => ({
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    onUpdate?.(html);
  },
  extensions: [
    StarterKit.configure({
      paragraph: {
        HTMLAttributes: { class: "mb-5" },
      },
    }),
    Document,
    Paragraph.configure({
      HTMLAttributes: { class: "mb-5" },
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
