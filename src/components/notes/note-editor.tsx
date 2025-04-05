import { Toggle } from "@/components/ui/toggle";
import { BubbleMenu, Editor, EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
export interface NoteEditorProps {
  editor: Editor;
  disabled?: boolean;
  className?: string;
  textEditorClassName?: string;
}

export default function NoteEditor({
  editor,
  disabled,
  className,
  textEditorClassName,
}: NoteEditorProps) {
  return (
    <div className={cn(className)}>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center bg-background border border-border rounded-md shadow-md overflow-hidden"
        >
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            className="data-[state=on]:bg-muted"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            className="data-[state=on]:bg-muted"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            className="data-[state=on]:bg-muted"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            className="data-[state=on]:bg-muted"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            className="data-[state=on]:bg-muted"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            className="data-[state=on]:bg-muted"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </BubbleMenu>
      )}
      <EditorContent
        disabled={disabled}
        editor={editor}
        className={cn(
          "min-h-[180px] md:min-h-[200px] max-h-[200px] md:max-h-[300px] px-3 prose prose-sm max-w-none focus:outline-none overflow-auto",
          textEditorClassName,
        )}
      />
    </div>
  );
}
    