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
  Save,
  User,
  AudioLines,
  ChevronDown,
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
import { EventTracker } from "@/eventTracker";
import { FormatDropdown } from "@/components/ui/text-editor/dropdowns/format-dropdown";
import { ImprovementType } from "@/lib/prompts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Define frontend model type
type FrontendModel = "gpt-4.5" | "claude-3.5" | "claude-3.7";

// Define format options for the dropdown
const formatOptions: {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  tooltip?: string;
  type: ImprovementType;
}[] = [
  // {
  //   type: "fact-check",
  //   label: "Fact-check",
  //   subLabel: "Check the text for accuracy",
  //   icon: Check,
  //   divider: false,
  // },
  {
    type: "new-version",
    label: "New version",
    subLabel: "Same but new",
    tooltip: "Keep the same topic, but change the note",
    icon: AudioLines,
    divider: false,
  },
  {
    type: "fit-user-style",
    label: "Fit my style",
    subLabel: "Fill in the blanks",
    tooltip: "Make it sound like you",
    icon: User,
    divider: false,
  },
  {
    type: "elaborate",
    label: "Keep writing",
    tooltip: "Complete to a full note",
    icon: Sparkles,
    divider: false,
  },
  {
    type: "human-like",
    label: "Human-like",
    subLabel: "Make it more",
    tooltip: "Make it more human-like",
    icon: User,
    divider: false,
  },
  {
    type: "engaging",
    label: "Engaging",
    tooltip: "Make it more engaging",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "humorous",
    label: "Humorous",
    tooltip: "Make it more humorous",
    icon: Smile,
    divider: false,
  },
  {
    type: "positive",
    label: "Positive",
    tooltip: "Make it more positive",
    icon: ThumbsUp,
    divider: false,
  },
  {
    type: "creative",
    label: "Creative",
    tooltip: "Make it more creative",
    icon: Wand2,
    divider: false,
  },
  {
    type: "sarcastic",
    label: "Sarcastic",
    tooltip: "Make it more sarcastic",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "inspirational",
    label: "Inspirational",
    tooltip: "Make it more inspirational",
    icon: Zap,
    divider: false,
  },
  {
    type: "concise",
    label: "Concise",
    tooltip: "Make it more concise",
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

// Define AI models
const AI_MODELS: { value: FrontendModel; label: string }[] = [
  { value: "gpt-4.5", label: "GPT-4.5" },
  { value: "claude-3.5", label: "Claude 3.5" },
  { value: "claude-3.7", label: "Claude 3.7" },
];

export default function GenerateNotesSidebar() {
  const {
    updateShowGenerateNotesSidebar,
    showGenerateNotesSidebar,
    hasAdvancedGPT,
  } = useUi();
  const {
    generateNewNotes,
    selectedNote,
    editNoteBody,
    loadingEditNote,
    selectNote,
    improveText,
  } = useNotes();
  const [open, setOpen] = useState(false);
  const [loadingGenerateNewIdea, setLoadingGenerateNewIdea] = useState(false);
  const [loadingImprovement, setLoadingImprovement] = useState(false);
  const [selectedModel, setSelectedModel] = useState<FrontendModel>("gpt-4.5");
  const [useTopTypes, setUseTopTypes] = useState(false);
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
      const isInspirationNotSaved =
        selectedNote?.isFromInspiration && !selectedNote;
      if (isInspirationNotSaved) {
        return;
      }
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
      await generateNewNotes(selectedModel, {
        useTopTypes,
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.. Try again.");
    } finally {
      setLoadingGenerateNewIdea(false);
    }
  };

  const handleImproveText = async (type: ImprovementType) => {
    if (loadingImprovement) return;
    EventTracker.track("generate_notes_sidebar_improve_text_" + type);

    let selectedText =
      editor?.state.selection.content().content.firstChild?.textContent;

    if (!selectedText || selectedText.trim().length === 0) {
      selectedText = unformatText(editor?.getHTML() || "");
    }

    setLoadingImprovement(true);
    try {
      const improvedText = await improveText(
        selectedText,
        type,
        selectedNote?.id || null,
        selectedModel,
      );
      if (improvedText) {
        editor?.chain().focus().setContent(improvedText.text).run();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to improve text");
    } finally {
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

  const canSave = useMemo(() => {
    return (selectedNote || contentRaw.length > 0) && !loadingEditNote;
  }, [selectedNote, content, loadingEditNote]);

  const improveDropdownOptions = useMemo(() => {
    return formatOptions;
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
                  <FormatDropdown
                    options={improveDropdownOptions}
                    loading={loadingImprovement ? "loading" : null}
                    onSelect={type => {
                      handleImproveText(type as ImprovementType);
                    }}
                    type="text"
                    disabled={loadingImprovement}
                    trigger={
                      <TooltipButton
                        disabled={!hasContent || loadingImprovement}
                        tooltipContent="Improve selected text (1 credit)"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {loadingImprovement ? (
                          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TooltipButton>
                    }
                  />
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
                  <TooltipButton
                    tooltipContent="Save"
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    disabled={loadingEditNote || !canSave}
                    onClick={() => {
                      handleEditNoteBody(selectedNote?.id || null, content);
                    }}
                  >
                    {loadingEditNote ? (
                      <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TooltipButton>
                  <TooltipButton
                    tooltipContent="Copy"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!hasContent}
                    onClick={handleCopy}
                  >
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  </TooltipButton>
                </div>
              </div>
            </div>

            {/* Model Selection Dropdown */}
            {hasAdvancedGPT && (
              <div className="mt-6 mb-2">
                <label className="text-sm text-muted-foreground mb-1 flex items-center">
                  AI Model
                  <TooltipButton
                    tooltipContent="Select which AI model to use for generating notes"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </TooltipButton>
                </label>
                <Select
                  value={selectedModel}
                  onValueChange={(value: FrontendModel) =>
                    setSelectedModel(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/*   box for top types */}
                <div className="flex items-center mt-2 mb-4 gap-2">
                  <Checkbox
                    checked={useTopTypes}
                    onCheckedChange={(checked: boolean) =>
                      setUseTopTypes(checked)
                    }
                  />
                  <label className="text-sm text-muted-foreground">
                    Use best types of notes
                  </label>
                </div>
              </div>
            )}

            {/* Generate Notes Button */}
            <Button
              className="w-full mt-2"
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
