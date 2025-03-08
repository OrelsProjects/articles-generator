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
  Plus,
  Loader2,
  Copy,
  Check,
  ImagePlus,
  MessageSquareQuote,
  StickyNote,
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
import MainActionButton from "@/components/ui/main-action-button";
import SendToDraftButton from "@/components/ui/send-to-draft-button";
import { Editor } from "@tiptap/react";
import { Level } from "@tiptap/extension-heading";
import { selectUi, setShowIdeasPanel } from "@/lib/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { Idea } from "@/types/idea";
import { useIdea } from "@/lib/hooks/useIdea";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { AnimatePresence, motion } from "framer-motion";
import { Logger } from "@/logger";
import { getSelectedContentAsMarkdown } from "@/lib/utils/text-editor";

const MotionCheck = motion.create(Check);
const MotionCopy = motion.create(Copy);

interface MenuBarProps {
  editor: Editor | null;
  publication: Publication | null;
  selectedIdea: Idea | null;
  onCopy: (copyType: "title" | "subtitle" | "body") => void;
}

export const MenuBar = ({
  editor,
  publication,
  selectedIdea,
  onCopy,
}: MenuBarProps) => {
  const { state } = useAppSelector(selectUi);
  const { createNewIdea } = useIdea();
  const [didCopy, setDidCopy] = useState(false);

  const [loadingNewIdea, setLoadingNewIdea] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    if (didCopy) {
      setTimeout(() => {
        setDidCopy(false);
      }, 3000);
    }
  }, [didCopy]);

  const handleCreateNewIdea = () => {
    setLoadingNewIdea(true);
    createNewIdea({ showIdeasAfterCreate: true })
      .catch((error: any) => {
        toast.error(error.response?.data?.error || "Failed to create new idea");
      })
      .finally(() => {
        setLoadingNewIdea(false);
      });
  };

  const handleCopy = (copyType: "title" | "subtitle" | "body") => {
    try {
      onCopy(copyType);
      setDidCopy(true);
    } catch (error: any) {
      toast.error("Failed to copy content");
      Logger.error("Failed to copy content:", error);
    }
  };

  const handleImageInsert = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const handlePullQuote = () => {
    if (!editor) return;
    const selectedText = getSelectedContentAsMarkdown(editor);
    // If the selected text is a header, remove the header. Use editor to check it
    const isHeader = editor.isActive("heading");
    if (isHeader) {
      editor.chain().focus().setParagraph().run();
    }

    // If the select text is already a pullquote, remove it
    if (editor.isActive("pullquote")) {
      editor
        .chain()
        .focus()
        .command(({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;

          // Traverse the document nodes in the selected range
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === "pullquote") {
              changed = true;
              // Grab the node’s text content
              const textContent = node.textContent;
              // Remove the entire pullquote node
              tr.deleteRange(pos, pos + node.nodeSize);
              // Insert a plain paragraph with that text
              tr.insert(
                pos,
                state.schema.nodes.paragraph.create(
                  {},
                  state.schema.text(textContent),
                ),
              );
            }
          });

          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        })
        .run();
    } else if (selectedText) {
      editor
        .chain()
        .focus()
        .insertContent(`<div class="pullquote"><p>${selectedText}</p></div>`)
        .run();
    }
  };

  const handleBlockquote = () => {
    if (!editor) return;
    const selectedText = getSelectedContentAsMarkdown(editor);
    // If the selected text is a header, remove the header. Use editor to check it
    const isHeader = editor.isActive("heading");
    if (isHeader) {
      editor.chain().focus().setParagraph().run();
    }
    if (editor.isActive("blockquote")) {
      editor.chain().focus().lift("blockquote").run();
    } else if (selectedText) {
      editor?.chain().focus().toggleBlockquote().run();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const imageUrl = e.target?.result as string;
        editor?.chain().focus().setImage({ src: imageUrl }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!editor) return null;

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-start gap-2 p-2 border-b overflow-x-auto scrollbar-hide md:justify-center md:gap-3 md:p-3",
          { "border-b-0 mt-4": state !== "full" },
        )}
      >
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8"
          >
            <Undo className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8"
          >
            <Redo className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
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
            className={cn("h-8 w-8", editor.isActive("bold") && "bg-muted")}
          >
            <Bold className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8", editor.isActive("italic") && "bg-muted")}
          >
            <Italic className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-8 w-8", editor.isActive("strike") && "bg-muted")}
          >
            <Strikethrough className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn("h-8 w-8", editor.isActive("code") && "bg-muted")}
          >
            <Code className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("bulletList") && "bg-muted",
            )}
          >
            <List className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("orderedList") && "bg-muted",
            )}
          >
            <ListOrdered className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageSquareQuote className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleBlockquote()}
                disabled={editor.isActive("pullquote")}
              >
                <div className="flex items-center justify-between gap-4">
                  Block quote
                  {editor.isActive("blockquote") ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePullQuote}
                disabled={editor.isActive("blockquote")}
              >
                <div className="flex items-center justify-between gap-4">
                  Pull quote
                  {editor.isActive("pullquote") ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : null}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <ImagePlus className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-20 space-x-2"
            >
              <AnimatePresence mode="wait">
                {didCopy ? (
                  <MotionCheck
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    key={`did-copy`}
                    className="w-4 h-4"
                  />
                ) : (
                  <MotionCopy
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    key={`copy`}
                    className="w-4 h-4"
                  />
                )}
              </AnimatePresence>
              <span>Copy</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleCopy("title")}>
              Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("subtitle")}>
              Subtitle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("body")}>
              Body
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-8 w-fit px-2 py-4 space-x-2"
              disabled={loadingNewIdea}
            >
              {loadingNewIdea ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              )}
              <p className="text-sm pr-1">New</p>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={handleCreateNewIdea}
              className="hover:cursor-pointer"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Draft
            </DropdownMenuItem>
            <GenerateIdeasButton
              variant="ghost"
              className="w-full h-fit font-normal text-sm pl-2 flex justify-start py-1.5"
            />

            {!!selectedIdea && (
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <SendToDraftButton
                  publicationUrl={publication?.url || null}
                  variant="ghost"
                  className="w-full h-fit font-normal text-sm pl-0 gap-2 !py-1.5"
                />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1 md:gap-2">
          <MainActionButton />
        </div>
      </div>
    </>
  );
};
