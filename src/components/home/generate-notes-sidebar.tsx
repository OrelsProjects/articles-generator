"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Pencil,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Sparkles,
  SmilePlus,
  RefreshCw,
  Copy,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import {
  copyHTMLToClipboard,
  notesTextEditorOptions,
  unformatText,
} from "@/lib/utils/text-editor";
import { Toggle } from "@/components/ui/toggle";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotes } from "@/lib/hooks/useNotes";
import { convertMDToHtml, NoteDraft } from "@/types/note";
import { toast } from "react-toastify";
import { useUi } from "@/lib/hooks/useUi";
import { debounce } from "lodash";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { ToastStepper } from "@/components/ui/toast-stepper";

// Define loading states for generating ideas
const ideaLoadingStates = [
  { text: "Finding relevant notes..." },
  { text: "Gathering inspiration from top notes..." },
  { text: "Crafting unique notes..." },
  { text: "Finalizing the best notes..." },
];

export default function GenerateNotesSidebar() {
  const { updateShowGenerateNotesSidebar, showGenerateNotesSidebar } = useUi();
  const {
    generateNewNotes,
    selectedNote,
    editNoteBody,
    loadingEditNote,
    selectNote,
  } = useNotes();
  const [open, setOpen] = useState(false);
  const [loadingGenerateNewIdea, setLoadingGenerateNewIdea] = useState(false);
  const [previousSelectedNote, setPreviousSelectedNote] =
    useState<NoteDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showGenerateNotesSidebar) {
      setOpen(true);
      // set to false after 100ms
      setTimeout(() => {
        updateShowGenerateNotesSidebar(false);
      }, 100);
    }
  }, [showGenerateNotesSidebar]);

  const handleEditNoteBody = async (noteId: string | null, html: string) => {
    if (loadingEditNote) return;
    const body = unformatText(html);
    try {
      await editNoteBody(noteId, body);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onEditNoteBody = useCallback(
    debounce(async (noteId: string | null, html: string) => {
      handleEditNoteBody(noteId, html);
    }, 3500),
    [],
  );

  const editor = useEditor(
    notesTextEditorOptions(html => {
      onEditNoteBody(selectedNote?.id || null, html);
    }),
  );

  const contentRaw = useMemo(() => {
    const html = editor?.getHTML() || "";
    return unformatText(html);
  }, [editor?.getHTML()]);

  const content = useMemo(() => {
    return editor?.getHTML() || "";
  }, [editor?.getHTML()]);

  const handleCopy = async () => {
    const html = editor?.getHTML();
    if (!html) {
      toast.error("No content to copy");
      return;
    }
    await copyHTMLToClipboard(html);
    toast.success("Copied to clipboard");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // add to the end of the file
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
      await generateNewNotes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingGenerateNewIdea(false);
    }
  };

  useEffect(() => {
    if (!selectedNote) {
      editor?.commands.setContent("");
      return;
    }
    if (selectedNote?.id !== previousSelectedNote?.id) {
      setPreviousSelectedNote(selectedNote);
      if (!open) {
        setOpen(true);
      }
    }
    if (selectedNote) {
      convertMDToHtml(selectedNote.body).then(html => {
        editor?.commands.setContent(html);
      });
    }
  }, [selectedNote]);

  const handleToggleSidebar = () => {
    setOpen(!open);
  };

  const handleCreateDraftNote = async () => {
    selectNote(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleEditNoteBody(selectedNote?.id || null, content);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNote, content]);

  const hasContent = useMemo(() => {
    return selectedNote || contentRaw.length > 0;
  }, [selectedNote, content]);

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
          "fixed h-12 w-12 bottom-0 right-4 -translate-y-1/2 transition-all duration-300 bg-background shadow-md border border-border hover:bg-background p-0",
          open ? "!right-[400px]" : "",
        )}
        onClick={handleToggleSidebar}
      >
        {open ? (
          <ChevronRight className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Pencil className="h-6 w-6" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 w-[400px] h-full bg-background border-l border-border transition-all duration-300 transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              Compose
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm">Your content</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-sm hover:text-primary"
                onClick={handleCreateDraftNote}
                disabled={!hasContent}
              >
                <Plus className="h-5 w-5 text-primary" />
                New draft
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
                disabled={loadingGenerateNewIdea}
                editor={editor}
                className="min-h-[200px] max-h-[300px] px-3 prose prose-sm max-w-none focus:outline-none overflow-auto"
              />

              {/* Toolbar */}
              <div className="border-t border-border p-2 flex items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </Button> */}
                  <TooltipButton
                    tooltipContent="Generate new notes (3 credits)"
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
                  </TooltipButton>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                >
                  <Copy className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div
              className={cn("w-full flex justify-between gap-2 mt-4", {
                hidden: !hasContent,
              })}
            >
              <div className="mt-2 text-xs text-muted-foreground">
                {loadingEditNote
                  ? "saving..."
                  : selectedNote?.id
                    ? "saved"
                    : "Start writing"}
              </div>
              <Button
                className="w-fit"
                disabled={loadingEditNote}
                onClick={() => {
                  handleEditNoteBody(selectedNote?.id || null, content);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ToastStepper
        loadingStates={ideaLoadingStates}
        loading={loadingGenerateNewIdea}
        duration={7000}
        loop={false}
        position="bottom-left"
      />
    </div>
  );
}
