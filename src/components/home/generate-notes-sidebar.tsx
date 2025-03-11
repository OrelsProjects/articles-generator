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
  Check,
  MessageSquare,
  Smile,
  ThumbsUp,
  Wand2,
  Zap,
  FileText,
  ChevronDown,
  Save,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventTracker } from "@/eventTracker";

// Define improvement types
type ImprovementType =
  | "fact-check"
  | "elaborate"
  | "engaging"
  | "humorous"
  | "positive"
  | "creative"
  | "sarcastic"
  | "inspirational"
  | "concise";

// Define format options for the dropdown
const formatOptions: {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  type: ImprovementType;
}[] = [
  {
    type: "fact-check",
    label: "Fact-check",
    subLabel: "Check the text for accuracy",
    icon: Check,
    divider: false,
  },
  {
    type: "elaborate",
    label: "Elaborate",
    subLabel: "Make it more",
    icon: Sparkles,
    divider: false,
  },
  {
    type: "engaging",
    label: "Engaging",
    icon: MessageSquare,
    subLabel: "Make it more",
    divider: false,
  },
  {
    type: "humorous",
    label: "Humorous",
    icon: Smile,
    divider: false,
  },
  {
    type: "positive",
    label: "Positive",
    icon: ThumbsUp,
    divider: false,
  },
  {
    type: "creative",
    label: "Creative",
    icon: Wand2,
    divider: false,
  },
  {
    type: "sarcastic",
    label: "Sarcastic",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "inspirational",
    label: "Inspirational",
    icon: Zap,
    divider: false,
  },
  {
    type: "concise",
    label: "Concise",
    icon: FileText,
    divider: false,
  },
];

// Define loading states for generating ideas
const ideaLoadingStates = [
  { text: "Finding relevant notes..." },
  { text: "Gathering inspiration from top notes..." },
  { text: "Putting together unique ideas..." },
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
  const [loadingImprovement, setLoadingImprovement] = useState(false);
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
    if (!selectedNote && !body) {
      return;
    }
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
      toast.error(e.message || "Something went wrong.. Try again.");
    } finally {
      setLoadingGenerateNewIdea(false);
    }
  };

  const handleImproveText = async (type: ImprovementType) => {
    if (loadingImprovement) return;
    EventTracker.track("generate_notes_sidebar_improve_text_" + type);

    const selectedText =
      editor?.state.selection.content().content.firstChild?.textContent;

    if (!selectedText || selectedText.trim().length === 0) {
      toast.error("Please select some text to improve");
      return;
    }

    setLoadingImprovement(true);
    try {
      // Here you would call your API to improve the text
      toast.info(`Improving text with ${type} style...`);
      // Placeholder for actual implementation
      setTimeout(() => {
        toast.success(`Text improved with ${type} style`);
        setLoadingImprovement(false);
      }, 1500);
    } catch (e: any) {
      toast.error(e.message || "Failed to improve text");
      setLoadingImprovement(false);
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
                  {/* Dropdown for text improvements */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <TooltipButton
                        tooltipContent="Improve selected text (1)"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={loadingImprovement || !hasContent}
                      >
                        {loadingImprovement ? (
                          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                        ) : (
                          <div className="flex items-center">
                            <Sparkles className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TooltipButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {formatOptions.map(option => (
                        <DropdownMenuItem
                          key={option.type}
                          onClick={() => handleImproveText(option.type)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <option.icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.subLabel && (
                              <span className="text-xs text-muted-foreground">
                                {option.subLabel}
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    disabled={loadingEditNote || !hasContent}
                    onClick={() => {
                      handleEditNoteBody(selectedNote?.id || null, content);
                    }}
                  >
                    {loadingEditNote ? (
                      <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!hasContent}
                    onClick={handleCopy}
                  >
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Generate Notes Button */}
            <Button
              className="w-full mt-8"
              onClick={handleGenerateNewNote}
              disabled={loadingGenerateNewIdea}
            >
              {loadingGenerateNewIdea ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Generate notes (3)
            </Button>
          </div>
        </div>
      </div>
      <ToastStepper
        loadingStates={ideaLoadingStates}
        loading={loadingGenerateNewIdea}
        duration={5000}
        loop={false}
        position="bottom-left"
      />
    </div>
  );
}
