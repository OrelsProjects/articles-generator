"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Image as ImageIcon,
  Sparkles,
  SmilePlus,
  RefreshCcw,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor, EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import { notesTextEditorOptions } from "@/lib/utils/text-editor";
import { Toggle } from "@/components/ui/toggle";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotes } from "@/lib/hooks/useNotes";
import { convertJsonToHtml, NoteDraft } from "@/types/note";
import { toast } from "react-toastify";

export default function GenerateNotesSidebar() {
  const { generateNewNote, selectedNote } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loadingGenerateNewIdea, setLoadingGenerateNewIdea] = useState(false);
  const [previousSelectedNote, setPreviousSelectedNote] = useState<NoteDraft | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor(
    notesTextEditorOptions(html => {
      setContent(html);
    }),
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmoji = (emoji: any) => {
    editor?.chain().focus().insertContent(emoji.native).run();
  };

  const handleGenerateNewNote = async () => {
    if (loadingGenerateNewIdea) {
      return;
    }
    setLoadingGenerateNewIdea(true);
    try {
      await generateNewNote();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingGenerateNewIdea(false);
    }
  };

  useEffect(() => {
      debugger;
    if (selectedNote?.id !== previousSelectedNote?.id) {
      setPreviousSelectedNote(selectedNote);
      if (!isOpen) {
        setIsOpen(true);
      }
    }
    if (selectedNote) {
      const htmlContent = convertJsonToHtml(selectedNote.jsonBody);
      editor?.commands.setContent(htmlContent);
    }
  }, [selectedNote]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative z-50">
      {/* Toggle Button */}
      <Button
        variant="neumorphic-primary"
        size="icon"
        className={cn(
          "fixed h-10 w-10 bottom-0 right-4 -translate-y-1/2 transition-all duration-300 bg-background shadow-md border border-border hover:bg-background p-0",
          isOpen ? "!right-[400px]" : "",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronRight className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Pencil className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 w-[400px] h-full bg-background border-l border-border transition-all duration-300 transform",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              Compose
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
              Drafts
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
              Scheduled
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
              Sent
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Your content</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-sm"
              >
                + New draft
              </Button>
            </div>

            {/* Editor */}
            <div className="min-h-[200px] w-full border border-border rounded-md relative">
              {editor && (
                <BubbleMenu
                  editor={editor}
                  tippyOptions={{ duration: 100 }}
                  className="flex items-center bg-background border border-border rounded-md shadow-md overflow-hidden"
                >
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("bold")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleBold().run()
                    }
                    className="data-[state=on]:bg-muted"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleItalic().run()
                    }
                    className="data-[state=on]:bg-muted"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleStrike().run()
                    }
                    className="data-[state=on]:bg-muted"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("code")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleCode().run()
                    }
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
                editor={editor}
                className="min-h-[200px] max-h-[300px] p-3 prose prose-sm max-w-none focus:outline-none overflow-auto"
              />

              {/* Toolbar */}
              <div className="border-t border-border p-2 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={loadingGenerateNewIdea}
                  onClick={handleGenerateNewNote}
                >
                  {loadingGenerateNewIdea ? (
                    <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <SmilePlus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-0 border-none"
                    side="top"
                    align="start"
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={addEmoji}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">saved</div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="flex justify-between items-center">
              <Button variant="secondary">Post now</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add to Queue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
