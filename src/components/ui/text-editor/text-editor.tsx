import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import { useEffect, useState, useMemo } from "react";
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

const DraftIndicator = ({
  saving,
  error,
}: {
  saving: boolean;
  error: boolean;
}) => {
  return (
    <div className="sticky top-0 ml-4 flex items-center gap-2 text-sm text-muted-foreground">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          saving ? "border border-green-500" : "bg-green-500",
          error ? "border border-red-500 bg-red-500" : "",
        )}
      />
      {!error && <span>{saving ? "Draft saving..." : "Draft"}</span>}
      {error && <span>Not saved</span>}
    </div>
  );
};

const TextEditor = ({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) => {
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
    } catch (error) {
      console.error("Failed to save:", error);
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
      editor?.commands.setContent(formatText(selectedIdea.body));
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
      console.error("Failed to improve:", error);
      toast.update(toastId, {
        render: error.message || "Failed to improve",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
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

  return (
    <div
      className={cn(
        "w-full max-w-[1200px] min-h-screen bg-background relative",
        className,
      )}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg"
        >
          <FormatDropdown
            editor={editor}
            loading={loadingImprovement}
            onImprove={handleImprovement}
            maxCharacters={1200}
          />
        </BubbleMenu>
      )}

      <div className="max-md:sticky max-md:top-14 bg-background z-10">
        <MenuBar
          editor={editor}
          publication={publication}
          hasChanges={hasChanges}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full flex flex-col justify-start items-center mt-4">
        <DraftIndicator saving={saving} error={savingError} />
        <div className="h-full flex flex-col justify-start items-center gap-2 w-full">
          <div className="h-full py-4 max-w-[728px] space-y-4 w-full px-4 text-foreground">
            <TextareaAutosize
              placeholder="Title"
              value={title}
              onChange={handleTitleChange}
              maxLength={200}
              className="w-full text-4xl font-bold outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
            />
            <TextareaAutosize
              placeholder="Add a subtitle..."
              value={subtitle}
              maxLength={200}
              onChange={handleSubtitleChange}
              className="w-full text-xl text-muted-foreground outline-none placeholder:text-muted-foreground border-none shadow-none resize-none focus-visible:ring-0 focus-visible:outline-none p-0"
            />
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

          <div className="border rounded-md p-4 max-h-[50vh] overflow-auto">
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
    </div>
  );
};

export default TextEditor;
