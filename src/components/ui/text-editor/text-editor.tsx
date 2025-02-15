import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MenuBar } from "@/components/ui/text-editor/menu-bar";
import { Idea } from "@/types/idea";
import { Publication } from "@/types/publication";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIdea } from "@/lib/hooks/useIdea";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";
import debounce from "lodash/debounce";
import { FormatDropdown } from "@/components/ui/text-editor/format-dropdown";
import { ImprovementType } from "@/lib/prompts";
import { toast } from "react-toastify";
import {
  formatText,
  getSelectedContentAsMarkdown,
  unformatText,
  textEditorOptions,
} from "@/lib/utils/text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Logger } from "@/logger";
import cuid from "cuid";
import { useUi } from "@/lib/hooks/useUi";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { Maximize2, Minimize2 } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { motion } from "framer-motion";

type ImageName = string;

const DraftIndicator = ({
  saving,
  error,
  hasIdea,
}: {
  saving: boolean;
  error: boolean;
  hasIdea: boolean;
}) => {
  return (
    <div className="sticky top-4 ml-4 flex items-center gap-2 text-sm text-muted-foreground">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          saving ? "border border-green-500" : "bg-green-500",
          error ? "border border-red-500 bg-red-500" : "",
          !hasIdea ? "border border-yellow-500 bg-yellow-500" : "",
        )}
      />
      {!hasIdea ? (
        <span className="text-muted-foreground/80">
          Generate an idea before editing
        </span>
      ) : (
        !error && <span>{saving ? "Draft saving..." : "Draft"}</span>
      )}
      {error && <span>Not saved</span>}
    </div>
  );
};

const ExpandButton = () => {
  const { setState } = useUi();
  const { state } = useAppSelector(selectUi);

  return (
    <TooltipButton
      variant="outline"
      onClick={() => setState(state === "full" ? "writing-mode" : "full")}
      tooltipContent={state === "full" ? "Collapse" : "Expand"}
      className="absolute top-4 right-4 z-50 hidden md:block"
    >
      {state === "full" ? (
        <Maximize2 className="w-4 h-4" />
      ) : (
        <Minimize2 className="w-4 h-4" />
      )}
    </TooltipButton>
  );
};

const TextEditor = ({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) => {
  const { state } = useAppSelector(selectUi);
  const { selectedIdea } = useAppSelector(state => state.publications);
  const { updateIdea, improveText } = useIdea();
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSubtitle, setOriginalSubtitle] = useState("");
  const [originalBody, setOriginalBody] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState(false);
  const [loadingImprovement, setLoadingImprovement] =
    useState<ImprovementType | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const previewEditorRef = useRef<HTMLDivElement>(null);

  const [loadingImages, setLoadingImages] = useState<
    {
      name: ImageName;
      position: number;
    }[]
  >([]);

  // store range for replacement
  const [improvementRange, setImprovementRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  const previewEditor = useEditor(textEditorOptions());
  const editor = useEditor(textEditorOptions(handleBodyChange));

  const handleSave = async () => {
    if (!selectedIdea) return;
    if (saving) return;
    setSaving(true);
    setSavingError(false);
    try {
      const updatedIdea: Idea = {
        ...selectedIdea,
        title,
        subtitle,
        body: unformatText(editor?.getHTML() || ""),
      };

      await updateIdea(
        selectedIdea.id,
        updatedIdea.body,
        updatedIdea.title,
        updatedIdea.subtitle,
      );

      setOriginalTitle(title);
      setOriginalSubtitle(subtitle);
      setOriginalBody(editor?.getHTML() || "");

      setHasChanges(false);
    } catch (error: any) {
      Logger.error("Failed to save:", error);
      setSavingError(true);
    } finally {
      // Add a small delay before hiding the saving indicator
      setTimeout(() => {
        setSaving(false);
      }, 500);
    }
  };

  // Create debounced save function
  const debouncedSave = useMemo(
    () => debounce(handleSave, 3000),
    [selectedIdea, title, subtitle, editor, updateIdea],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving]);

  // Call debouncedSave when content changes
  useEffect(() => {
    if (hasChanges) {
      debouncedSave();
    }
  }, [hasChanges, debouncedSave]);

  // Cancel debounced save on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  useEffect(() => {
    if (selectedIdea) {
      setOriginalTitle(selectedIdea.title);
      setTitle(selectedIdea.title);
      setOriginalSubtitle(selectedIdea.subtitle);
      setSubtitle(selectedIdea.subtitle);
      setOriginalBody(selectedIdea.body);
      const formattedBody = formatText(selectedIdea.body);
      editor?.commands.setContent(formattedBody);
    }
  }, [selectedIdea, editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const didChange = newTitle !== originalTitle;
    setHasChanges(didChange);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSubtitle = e.target.value;
    setSubtitle(newSubtitle);
    const didChange = newSubtitle !== originalSubtitle;
    setHasChanges(didChange);
  };

  function handleBodyChange(value: string) {
    const didChange = value !== originalBody;
    setHasChanges(didChange);
  }

  async function handleImprovement(type: ImprovementType) {
    if (!editor) return;
    if (!selectedIdea) return;
    if (loadingImprovement) return;

    setLoadingImprovement(type);

    const toastId = toast.loading(`Making it more ${type}`);

    try {
      const { state } = editor;
      const { from, to } = state.selection;
      if (from === to) throw new Error("No text selected.");

      const selectedMarkdown = getSelectedContentAsMarkdown(editor);
      if (!selectedMarkdown) throw new Error("Selected text is empty.");

      const response = await improveText(
        selectedMarkdown,
        type,
        from,
        to,
        selectedIdea.id,
      );
      if (!response || !response.text) {
        throw new Error("Improvement service failed.");
      }

      // store the range so we know where to re-insert later
      setImprovementRange({ from: response.textFrom, to: response.textTo });

      // set the content in the preview editor
      // we use 'formatText()' to convert the raw markdown or plain text into HTML for TipTap
      previewEditor?.commands.setContent(formatText(response.text));

      // show the modal
      setShowPreviewModal(true);

      toast.dismiss(toastId);
    } catch (error: any) {
      Logger.error("Failed to improve:", error);
      toast.update(toastId, {
        render: error.message || "Failed to improve",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoadingImprovement(null);
    }
  }

  function handleAcceptImprovement() {
    if (!editor || !previewEditor || !improvementRange) return;

    // get the user-edited text from previewEditor
    const newHTML = previewEditor.getHTML();

    // delete the old range in main editor, and insert the new content
    editor
      .chain()
      .focus()
      .deleteRange({ from: improvementRange.from, to: improvementRange.to })
      .insertContentAt(improvementRange.from, newHTML)
      .run();

    // close modal + clear the range
    setShowPreviewModal(false);
    setImprovementRange(null);
  }

  function handleCancelImprovement() {
    setShowPreviewModal(false);
    setImprovementRange(null);
  }

  // Add this effect to handle scroll reset
  useEffect(() => {
    if (showPreviewModal && previewEditorRef.current) {
      previewEditorRef.current.scrollTop = 0;
    }
  }, [showPreviewModal]);

  const handleFileDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      if (!editor || !selectedIdea) return;

      const { view } = editor;
      const position = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });

      if (!position) return; // Bail if no valid position

      setLoadingImages(prev => [
        ...prev,
        {
          name: event.dataTransfer?.files?.[0]?.name || "",
          position: position.pos,
        },
      ]);

      const files = Array.from(event.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith("image/"));

      // Add files to uploading state
      const uploadingFilesWithIds = imageFiles.map(file => ({
        id: cuid(),
        file,
      }));

      if (uploadingFilesWithIds.length > 0) {
        editor
          .chain()
          .focus()
          .insertContentAt(position.pos, {
            type: "skeleton",
          })
          .run();
      }
      // Upload each file
      for (const { id, file } of uploadingFilesWithIds) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(
            `/api/idea/${selectedIdea.id}/upload-file`,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!response.ok) throw new Error("Upload failed");

          const { url } = await response.json();

          // Insert the image at the saved position
          editor
            .chain()
            .focus()
            .deleteRange({ from: position.pos, to: position.pos + 1 }) // Remove skeleton
            .insertContentAt(position.pos, {
              type: "image",
              attrs: { src: url },
            })
            .run();
        } catch (error: any) {
          toast.error("Failed to upload image");
          Logger.error("Failed to upload file:", error);
        } finally {
          // Remove file from uploading state
          setLoadingImages(prev => prev.filter(f => f.name !== file.name));
        }
      }
    },
    [editor, selectedIdea],
  );

  // Add drop event listeners
  useEffect(() => {
    const editorElement = document.querySelector(".tiptap") as HTMLElement;
    if (!editorElement) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    editorElement.addEventListener("drop", handleFileDrop);
    editorElement.addEventListener("dragover", handleDragOver);

    return () => {
      editorElement.removeEventListener("drop", handleFileDrop);
      editorElement.removeEventListener("dragover", handleDragOver);
    };
  }, [handleFileDrop]);

  return (
    <motion.div
      initial={{ width: state === "full" ? "1200px" : "100%" }}
      animate={{ width: state === "full" ? "1200px" : "100%" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full min-h-screen bg-background relative border-r border-border",
        className,
      )}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 10 }}
          className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg"
        >
          <FormatDropdown
            editor={editor}
            loading={loadingImprovement}
            onImprove={handleImprovement}
            maxCharacters={15000}
          />
        </BubbleMenu>
      )}

      <div className="max-md:sticky max-md:top-14 bg-background z-50">
        <MenuBar
          editor={editor}
          publication={publication}
          title={title}
          subtitle={subtitle}
        />
      </div>
      <ScrollArea className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full flex flex-col justify-start items-center relative mt-4 md:mt-0">
        <ExpandButton />
        <DraftIndicator
          saving={saving}
          error={savingError}
          hasIdea={!!selectedIdea}
        />
        <div className="h-full flex flex-col justify-start items-center gap-2 w-full">
          <div className="h-full py-4 max-w-[728px] space-y-4 w-full px-4 text-foreground">
            <div className="flex items-center gap-2">
              <TextareaAutosize
                placeholder="Title"
                value={title}
                onChange={handleTitleChange}
                maxLength={200}
                className="w-full text-4xl font-bold outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <TextareaAutosize
                placeholder="Add a subtitle..."
                value={subtitle}
                maxLength={200}
                onChange={handleSubtitleChange}
                className="w-full text-xl text-muted-foreground outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
              />
            </div>
            <div className="pt-2 tiptap pb-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </ScrollArea>
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent
          closeOnOutsideClick={false}
          className="sm:max-w-[90vw] md:max-w-[60vw] max-h-[80vh]"
        >
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              You can make additional edits before accepting
            </DialogDescription>
          </DialogHeader>

          <div
            ref={previewEditorRef}
            className="border rounded-md p-4 pt-0 max-h-[50vh] overflow-auto relative"
          >
            <EditorContent editor={previewEditor} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImprovement}>
              Cancel
            </Button>
            <Button onClick={handleAcceptImprovement}>Accept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TextEditor;
