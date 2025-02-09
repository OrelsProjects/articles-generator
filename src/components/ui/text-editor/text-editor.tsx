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
import { useEffect, useState } from "react";
import { marked } from "marked";
import { MenuBar } from "@/components/ui/text-editor/menu-bar";
import { Idea } from "@/types/idea";
import { Publication } from "@/types/publication";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIdea } from "@/lib/hooks/useIdea";
import TurndownService from "turndown";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";

const formatText = (text: string) => {
  return marked(text);
};

const unformatText = (text: string) => {
  const turndownService = new TurndownService();
  return turndownService.turndown(text);
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

const TextEditor = ({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) => {
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

  const { selectedIdea } = useAppSelector(state => state.publications);
  const { updateIdea } = useIdea();
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSubtitle, setOriginalSubtitle] = useState("");
  const [originalOutline, setOriginalOutline] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedIdea) {
      setOriginalTitle(selectedIdea.title);
      setTitle(selectedIdea.title);
      setOriginalSubtitle(selectedIdea.subtitle);
      setSubtitle(selectedIdea.subtitle);
      setOriginalOutline(selectedIdea.outline);
      editor?.commands.setContent(formatText(selectedIdea.outline));
    }
  }, [selectedIdea, editor]);

  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      const originalOutlineHTML = formatText(originalOutline || "");
      const changeInTitle = title !== originalTitle;
      const changeInSubtitle = subtitle !== originalSubtitle;
      const changeInOutline = currentContent !== originalOutlineHTML;
      setHasChanges(changeInTitle || changeInSubtitle || changeInOutline);
    }
  }, [title, subtitle, editor?.getHTML()]);

  const handleSave = async () => {
    if (!selectedIdea) return;
    const updatedIdea: Idea = {
      ...selectedIdea,
      title,
      subtitle,
      outline: unformatText(editor?.getHTML() || ""),
    };

    setHasChanges(false);

    await updateIdea(
      selectedIdea.id,
      updatedIdea.outline,
      updatedIdea.title,
      updatedIdea.subtitle,
    );

    // Here you would typically call a function to save the changes
    // For example: onSaveIdea(updatedIdea);
    console.log("Saving changes:", updatedIdea);
  };

  return (
    <div
      className={cn(
        "w-full max-w-[1200px] min-h-screen bg-background relative",
        className,
      )}
    >
      <div className="max-md:sticky max-md:top-14 bg-background z-10">
        <MenuBar
          editor={editor}
          publication={publication}
          hasChanges={hasChanges}
          onSave={handleSave}
        />
      </div>
      <ScrollArea className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full flex flex-col justify-start items-center mt-4">
        <div className="h-full flex flex-col justify-start items-center gap-2 w-full">
          <div className="h-full py-4 max-w-[728px] space-y-4 w-full px-4 text-foreground">
            <TextareaAutosize
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              className="w-full text-4xl font-bold outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
            />
            <TextareaAutosize
              placeholder="Add a subtitle..."
              value={subtitle}
              maxLength={200}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full text-xl text-muted-foreground outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
            />
            <div className="pt-2 tiptap pb-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TextEditor;
