import { DOMSerializer } from "@tiptap/pm/model";
import { Editor, Extension, UseEditorOptions } from "@tiptap/react";
import { marked } from "marked";
import TurndownService from "turndown";

import StarterKit from "@tiptap/starter-kit";
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

  // Use ProseMirror’s DOMSerializer
  const div = document.createElement("div");
  const serializer = DOMSerializer.fromSchema(editor.schema);
  div.appendChild(serializer.serializeFragment(slice.content));

  return div.innerHTML;
}

export const formatText = (text: string): string => {
  return marked(text) as string;
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

// Convert HTML → Markdown properly
export const unformatText = (html: string): string => {
  return turndownService.turndown(html);
};

// A custom extension to map Enter key inside code blocks.
const CustomKeymap = Extension.create({
  name: "customKeymap",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.newlineInCode(),
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
    Image,
    Link,
    Subscript,
    Superscript,
    CodeBlock,
    Placeholder.configure({
      placeholder: "Start writing...",
    }),
  ],
  content: "",
  editorProps: {
    attributes: {
      class: "prose prose-lg mx-auto focus:outline-none h-full text-xl",
    },
  },
});
