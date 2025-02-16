"use client";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Save,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Publication } from "@/types/publication";
import { Separator } from "@/components/ui/separator";
import { copyTextEditorContent } from "@/lib/utils/copy";
import MainActionButton from "@/components/ui/main-action-button";
import SendToDraftButton from "@/components/ui/send-to-draft-button";
import { useState } from "react";
import { toast } from "react-toastify";
import { formatText, unformatText } from "@/lib/utils/text-editor";
import { Editor } from "@tiptap/react";
import { Level } from "@tiptap/extension-heading";

interface MenuBarProps {
  editor: Editor | null;
  publication: Publication | null;
}

export const MenuBar = ({ editor, publication }: MenuBarProps) => {
  if (!editor) return null;

  return (
    <>
      <div className="flex items-center justify-start gap-2 p-2 border-b overflow-x-auto scrollbar-hide md:justify-center md:gap-3 md:p-3">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Undo className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Redo className="w-4 h-4 md:w-6 md:h-6" />
          </Button>{" "}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-8 md:h-10">
              Style
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Array.from({ length: 7 }, (_, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => {
                  i === 0
                    ? editor.chain().focus().setParagraph().run()
                    : editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: i as Level })
                        .run();
                  editor.chain().focus().run();
                }}
              >
                {i === 0 ? "Normal text" : `Heading ${i}`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("bold") && "bg-muted",
            )}
          >
            <Bold className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("italic") && "bg-muted",
            )}
          >
            <Italic className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("strike") && "bg-muted",
            )}
          >
            <Strikethrough className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("code") && "bg-muted",
            )}
          >
            <Code className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("bulletList") && "bg-muted",
            )}
          >
            <List className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("orderedList") && "bg-muted",
            )}
          >
            <ListOrdered className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-1 md:gap-2">
          <MainActionButton publication={publication} />
          <SendToDraftButton publicationUrl={publication?.url || null} />
        </div>
      </div>
    </>
  );
};

/**
 *    <Separator orientation="vertical" className="h-6" />
        {/* Copy dropdown, items: title, subtitle, body */
// <DropdownMenu>
//   <DropdownMenuTrigger asChild>
//     <Button variant="outline" size="sm" className="gap-1 h-8 md:h-10">
//       Copy
//     </Button>
//   </DropdownMenuTrigger>
//   <DropdownMenuContent>
//     <DropdownMenuItem onClick={() => handleCopy("title")}>
//       Title
//     </DropdownMenuItem>
//     <DropdownMenuItem onClick={() => handleCopy("subtitle")}>
//       Subtitle
//     </DropdownMenuItem>
//     <DropdownMenuItem onClick={() => handleCopy("body")}>
//       Body
//     </DropdownMenuItem>
//   </DropdownMenuContent>
// </DropdownMenu>
