import { useEditor } from "@tiptap/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { MenuBar } from "@/components/ui/text-editor/menu-bar";
import { Idea } from "@/types/idea";
import { Publication } from "@/types/publication";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIdea } from "@/lib/hooks/useIdea";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";
import debounce from "lodash/debounce";
import { ImprovementType } from "@/lib/prompts";
import { toast } from "react-toastify";
import {
  formatText,
  getSelectedContentAsMarkdown,
  unformatText,
  textEditorOptions,
} from "@/lib/utils/text-editor";
import { Logger } from "@/logger";
import cuid from "cuid";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { motion } from "framer-motion";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { BubbleMenuComponent } from "@/components/ui/text-editor/dropdowns/bubble-menu";
import { TitleImprovementType } from "@/components/ui/text-editor/dropdowns/title-menu";
import BlankPage from "@/components/ui/text-editor/blank-page";

// Import our new subcomponents
import DraftIndicator from "./draft-indicator";
import TitleSection from "./title-section";
import SubtitleSection from "./subtitle-section";
import EditorArea from "./editor-area";
import PreviewModal from "./preview-modal";
import LoadingIdeas from "@/components/ui/loading-ideas";

type ImageName = string;

const TextEditor = ({
  publication,
  className,
}: {
  publication?: Publication;
  className?: string;
}) => {
  const { state } = useAppSelector(selectUi);
  const { selectedIdea } = useAppSelector(selectPublications);
  const { updateIdea, improveText, improveTitle } = useIdea();
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

  // Add state for floating menu
  const [showTitleMenu, setShowTitleMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = useCallback(
    async (ideaId: string) => {
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
        console.log("Updated idea", updatedIdea);

        await updateIdea(
          ideaId,
          updatedIdea.body,
          updatedIdea.title,
          updatedIdea.subtitle,
        );

        if (selectedIdea.id === ideaId) {
          setOriginalTitle(title);
          setOriginalSubtitle(subtitle);
          setOriginalBody(editor?.getHTML() || "");
        }

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
    },
    [selectedIdea, saving, title, subtitle, editor, updateIdea],
  );

  // Create debounced save function
  const debouncedSave = debounce(handleSave, 3000);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave(selectedIdea?.id || "");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving, title, subtitle, editor, selectedIdea]);

  // Call debouncedSave when content changes
  useEffect(() => {
    if (hasChanges) {
      debouncedSave(selectedIdea?.id || "");
    }
  }, [hasChanges, debouncedSave]);

  // Cancel debounced save on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  useEffect(() => {
    console.log("I was called here");
    if (selectedIdea) {
      setOriginalTitle(selectedIdea.title);
      updateTitle(selectedIdea.title, false);
      setOriginalSubtitle(selectedIdea.subtitle);
      updateSubtitle(selectedIdea.subtitle, false);
      setOriginalBody(selectedIdea.body);
      const formattedBody = formatText(selectedIdea.body);
      editor?.commands.setContent(formattedBody);
    }
  }, [selectedIdea, editor]);

  function updateTitle(newTitle: string, checkChanges = true) {
    setTitle(newTitle);
    if (checkChanges) {
      const didChange = newTitle !== originalTitle;
      setHasChanges(didChange);
    }
  }

  function updateSubtitle(newSubtitle: string, checkChanges = true) {
    setSubtitle(newSubtitle);
    if (checkChanges) {
      const didChange = newSubtitle !== originalSubtitle;
      setHasChanges(didChange);
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    updateTitle(newTitle);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSubtitle = e.target.value;
    updateSubtitle(newSubtitle);
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

    let toastId: number | string = "";
    if (type === "fact-check") {
      toastId = toast.loading(`Fact-checking...`);
    } else {
      toastId = toast.loading(`Making it more ${type}`);
    }

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

      if (response.text === originalBody) {
        let text = "No changes made";
        if (type === "fact-check") {
          text = "No changes made.";
        }
        toast.update(toastId, {
          render: text,
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        return;
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
        render: error.response?.data?.error || "Failed to improve",
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

  async function handleImproveTitle(
    menuType: "title" | "subtitle",
    improveType: TitleImprovementType,
  ) {
    if (!editor || !selectedIdea) return;
    if (loadingImprovement) return;

    setLoadingImprovement(improveType);

    let toastId: number | string = "";
    if (improveType === "generate") {
      toastId = toast.loading("Generating " + menuType);
    } else {
      toastId = toast.loading("Improving " + menuType);
    }

    try {
      const response = await improveTitle(
        menuType,
        improveType,
        selectedIdea.id,
      );

      if (menuType === "title") {
        updateTitle(response.title);
      } else {
        updateSubtitle(response.subtitle);
      }
      setHasChanges(true);
      toast.dismiss(toastId);
    } catch (error: any) {
      toast.update(toastId, {
        render: "Failed to improve title",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoadingImprovement(null);
    }
  }

  const handleCopy = async (copyType: "title" | "subtitle" | "body") => {
    if (!editor) return;
    let text = "";
    switch (copyType) {
      case "title":
        text = title;
        break;
      case "subtitle":
        text = subtitle;
        break;
      case "body":
        text = editor.getHTML();
        break;
    }

    const type = "text/html";
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    await navigator.clipboard.write(data);
  };

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

  useEffect(() => {
    console.log("showTitleMenu", showTitleMenu);
  }, [showTitleMenu]);

  return (
    <motion.div
      initial={{ width: state === "full" ? "100%" : "100%" }}
      animate={{ width: state === "full" ? "100%" : "100%" }}
      transition={{ duration: 0.2 }}
      className={cn("w-full h-full bg-background relative", className)}
    >
      <BubbleMenuComponent
        editor={editor}
        loading={`${loadingImprovement}`}
        handleImprovement={handleImprovement}
        className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg"
      />

      <div className="max-md:sticky max-md:top-14 bg-background z-50">
        <MenuBar
          editor={editor}
          publication={publication || null}
          selectedIdea={selectedIdea || null}
          onCopy={handleCopy}
        />
      </div>
      {publication && !!selectedIdea ? (
        <ScrollArea className="h-[calc(100vh-6rem)] w-full flex flex-col justify-start items-center relative mt-4 md:mt-0 pb-16">
          {/* <ExpandButton /> */}
          {publication && (
            <DraftIndicator
              saving={saving}
              error={savingError}
              hasIdea={!!selectedIdea}
            />
          )}
          <div className="h-full flex flex-col justify-start items-center gap-2 w-full">
            <div
              className={cn(
                "h-full py-4 max-w-[728px] space-y-4 w-full px-4 text-foreground",
                {
                  "pt-4": state !== "full",
                },
              )}
            >
              <TitleSection
                title={title}
                onTitleChange={handleTitleChange}
                showTitleMenu={showTitleMenu}
                setShowTitleMenu={setShowTitleMenu}
                titleRef={titleRef}
                onImproveTitle={handleImproveTitle}
              />
              <SubtitleSection
                subtitle={subtitle}
                onSubtitleChange={handleSubtitleChange}
                showSubtitleMenu={showSubtitleMenu}
                setShowSubtitleMenu={setShowSubtitleMenu}
                subtitleRef={subtitleRef}
                onImproveSubtitle={handleImproveTitle}
              />
              <EditorArea editor={editor} />
            </div>
          </div>
        </ScrollArea>
      ) : (
        <BlankPage hasPublication={!!publication} />
      )}
      <PreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        previewEditor={previewEditor}
        previewEditorRef={previewEditorRef}
        onCancel={handleCancelImprovement}
        onAccept={handleAcceptImprovement}
      />
      <LoadingIdeas />
    </motion.div>
  );
};

export default TextEditor;
