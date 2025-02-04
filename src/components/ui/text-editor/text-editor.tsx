import { useEditor, EditorContent } from "@tiptap/react";
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
import { Extension } from "@tiptap/core";
import { useState } from "react";
import { marked } from "marked";
import { Input } from "@/components/ui/input";
import { MenuBar } from "@/components/ui/text-editor/menu-bar";
import { TopNav } from "@/components/ui/text-editor/top-navbar";

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
            class:
              "text-[2.5em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 2:
        return [
          "h2",
          {
            ...HTMLAttributes,
            class:
              "text-[2.125em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 3:
        return [
          "h3",
          {
            ...HTMLAttributes,
            class:
              "text-[1.875em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 4:
        return [
          "h4",
          {
            ...HTMLAttributes,
            class:
              "text-[1.625em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 5:
        return [
          "h5",
          {
            ...HTMLAttributes,
            class:
              "text-[1.125em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 6:
        return [
          "h6",
          {
            ...HTMLAttributes,
            class:
              "text-[0.83em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      default:
        return ["h" + node.attrs.level, HTMLAttributes, 0];
    }
  },
});

const TextEditor = ({ publicationId }: { publicationId: string | null }) => {
  const editor = useEditor({
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
        levels: [1, 2],
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

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  // Callback to update title, subtitle, and editor content when the outline changes.
  const handleOutlineUpdate = (outlineData: {
    title: string;
    subtitle: string;
    outline: string;
  }) => {
    setTitle(outlineData.title);
    setSubtitle(outlineData.subtitle);
    if (outlineData.outline && editor) {
      editor.commands.setContent(marked(outlineData.outline));
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10">
        <TopNav />
        <MenuBar
          editor={editor}
          onOutlineUpdate={handleOutlineUpdate}
          publicationId={publicationId}
        />
      </div>
      <div className="w-full flex flex-col justify-start items-center">
        <div className="flex flex-col justify-start items-center gap-2 w-full">
          <div className="py-4 max-w-[728px] space-y-6 w-full px-4">
            <Input
              placeholder="Title"
              value={title}
              aria-multiline={false}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              className="w-full text-4xl font-bold outline-none placeholder:text-gray-400 border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
            />
            <Input
              placeholder="Add a subtitle..."
              value={subtitle}
              maxLength={200}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full text-xl text-gray-500 outline-none placeholder:text-gray-400 border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none  p-0"
            />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
