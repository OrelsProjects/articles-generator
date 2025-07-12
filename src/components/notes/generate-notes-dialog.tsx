"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ChevronDown, X } from "lucide-react";
import { useNotes } from "@/lib/hooks/useNotes";
import {
  AiModelsDropdown,
  FrontendModel,
} from "@/components/notes/ai-models-dropdown";
import { ToastStepper } from "@/components/ui/toast-stepper";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { useWriter } from "@/lib/hooks/useWriter";
import { ArticleSelectionDialog } from "./article-selection-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Article } from "@/types/article";
import ArticleComponent from "@/components/ui/article-component";
import { cn } from "@/lib/utils";
import AutoAdjustTextArea from "@/components/ui/auto-adjust-textarea";
import { useUi } from "@/lib/hooks/useUi";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NoteLengthSection, NoteCountSection } from "./note-generator/advanced";
import { NotesGenerateOptions } from "@/types/notes-generate-options";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { languageValueToLabel } from "@/components/settings/consts";
import { TooltipButton } from "@/components/ui/tooltip-button";

const ideaLoadingStates = [
  { text: "Finding relevant notes..." },
  { text: "Gathering inspiration from top notes..." },
  { text: "Putting together unique ideas..." },
  { text: "Finalizing the best notes..." },
];

type GenerateSource = "description" | "posts";

export interface GenerateNotesDialogProps {
  onOpenChange?: (open: boolean) => void;
  onClick?: () => void;
  defaultOpen?: boolean;
  defaultSource?: GenerateSource;
  variant?: "default" | "ghost";
  tooltip?: boolean;
}

export function GenerateNotesDialog({
  defaultSource,
}: GenerateNotesDialogProps) {
  const params = useParams();
  const handle = params?.handle as string;
  const { user } = useAppSelector(selectAuth);
  const {
    hasAdvancedGPT,
    showGenerateNotesDialog,
    updateShowGenerateNotesDialog,
  } = useUi();

  const [noteGenerationOptions, setNoteGenerationOptions] =
    useLocalStorage<NotesGenerateOptions | null>(
      "note_generation_options",
      null,
    );

  const [topic, setTopic] = useState("");
  const {
    generateNewNotes,
    isLoadingGenerateNotes,
    errorGenerateNotes,
    notesToGenerate,
  } = useNotes();
  const {
    articles,
    isLoadingArticles,
    hasMoreArticles,
    fetchPosts,
    fetchNextArticlesPage,
  } = useWriter(handle || "");

  const [selectedModel, setSelectedModel] = useState<FrontendModel>("auto");
  const [selectedSource, setSelectedSource] = useState<GenerateSource>(
    defaultSource || "description",
  );
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [hoveredArticle, setHoveredArticle] = useState<Article | null>(null);
  const [includeArticleLinks, setIncludeArticleLinks] =
    useLocalStorage<boolean>("include_articles_checked", true);

  // Advanced options state
  const [noteLengthEnabled, setNoteLengthEnabled] = useState(false);
  const [noteLength, setNoteLength] = useState<number | null>(null);
  const [noteCountEnabled, setNoteCountEnabled] = useState(false);
  const [noteCount, setNoteCount] = useState(notesToGenerate);

  useEffect(() => {
    if (errorGenerateNotes) {
      toast.error(errorGenerateNotes);
    }
  }, [errorGenerateNotes]);

  useEffect(() => {
    if (noteGenerationOptions) {
      setNoteLength(noteGenerationOptions.noteLength || null);
      setNoteCount(noteGenerationOptions.noteCount || notesToGenerate);
      setNoteLengthEnabled(noteGenerationOptions.noteLengthEnabled || false);
      setNoteCountEnabled(noteGenerationOptions.noteCountEnabled || false);
    }
  }, [noteGenerationOptions, notesToGenerate]);

  // Load articles when needed
  useEffect(() => {
    if (handle && selectedSource === "posts" && articles.length === 0) {
      fetchPosts();
    }
  }, [handle, selectedSource, articles.length, fetchPosts]);

  const handleGenerateNewNote = async () => {
    if (isLoadingGenerateNotes) {
      return;
    }
    try {
      // Build options object with advanced settings
      const options: any = {
        topic,
        clientId: showGenerateNotesDialog.clientId,
      };

      // Add advanced options if enabled
      if (noteLengthEnabled && noteLength) {
        options.length = noteLength;
      }

      if (noteCountEnabled && noteCount) {
        options.count = noteCount;
      }

      // Different logic based on source
      if (selectedSource === "description") {
        await generateNewNotes(selectedModel, options);
      } else {
        // Using articles
        await generateNewNotes(selectedModel, {
          ...options,
          preSelectedPostIds: selectedArticles.map(article => article.id),
          includeArticleLinks,
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const hasAdvancedOptions = useMemo(() => {
    return noteLengthEnabled || noteCountEnabled;
  }, [noteLengthEnabled, noteCountEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateNewNote();
  };

  const handleUpdateSelectedSource = (source: GenerateSource) => {
    setSelectedSource(source);
    if (source === "posts") {
      if (articles.length <= 0) {
        fetchPosts();
      }
    }
  };

  const handleArticlesSelected = (articles: Article[]) => {
    setSelectedArticles(articles);
  };

  const handleRemoveArticle = (articleId: string) => {
    setSelectedArticles(
      selectedArticles.filter(article => article.id !== articleId),
    );
  };

  const handleNotesCountEnabledChange = (enabled: boolean) => {
    setNoteGenerationOptions({
      ...noteGenerationOptions,
      noteCountEnabled: enabled,
    });
    setNoteCountEnabled(enabled);
  };

  const handleNotesLengthEnabledChange = (enabled: boolean) => {
    setNoteGenerationOptions({
      ...noteGenerationOptions,
      noteLengthEnabled: enabled,
    });
    setNoteLengthEnabled(enabled);
  };

  const handleNotesCountChange = (count: number) => {
    setNoteGenerationOptions({
      ...noteGenerationOptions,
      noteCount: count,
    });
    setNoteCount(count);
  };

  const handleNotesLengthChange = (noteLength: number) => {
    setNoteGenerationOptions({
      ...noteGenerationOptions,
      noteLength,
    });
    setNoteLength(noteLength);
  };

  const language = useMemo(() => {
    return user?.meta?.preferredLanguage || "en";
  }, [user]);

  return (
    <>
      <Dialog
        open={showGenerateNotesDialog.show}
        onOpenChange={open => {
          updateShowGenerateNotesDialog(open, showGenerateNotesDialog.clientId);
        }}
      >
        <DialogContent className="overflow-auto sm:max-w-[625px] max-h-[88vh]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Notes Generator</DialogTitle>
              <DialogDescription>
                {selectedSource === "description" ? (
                  <span>
                    The notes will be generated based on your note analysis.
                  </span>
                ) : (
                  <span>
                    The notes will be generated based on the articles you
                    choose.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Based on</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {selectedSource === "description"
                        ? "Your publication analysis"
                        : "Past articles"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => handleUpdateSelectedSource("description")}
                    >
                      Your publication analysis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateSelectedSource("posts")}
                    >
                      Past articles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {selectedSource === "description" ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="topic" className="col-span-4">
                    Topic{" "}
                    <span className="text-xs text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <div className="col-span-4 relative">
                    <AutoAdjustTextArea
                      id="topic"
                      placeholder="Describe the topic you want AI to write about."
                      className="w-full focus-visible:ring-muted-foreground/50"
                      value={topic}
                      maxRows={8}
                      onChange={e => setTopic(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full items-center gap-4">
                  <div className="w-full bg-muted-foreground/5 rounded-md p-4 space-y-4 mb-6">
                    <div className="w-full flex flex-row items-center justify-between gap-2">
                      <Label className="col-span-4">
                        Selected Articles ({selectedArticles.length}/
                        {notesToGenerate})
                      </Label>
                      <TooltipButton variant="clean">
                        <div className="flex flex-row items-center gap-2 px-2">
                          <Checkbox
                            type="button"
                            checked={includeArticleLinks}
                            onCheckedChange={() =>
                              setIncludeArticleLinks(!includeArticleLinks)
                            }
                            className="w-4 h-4"
                          />
                          <Label
                            className="text-sm cursor-pointer"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIncludeArticleLinks(!includeArticleLinks);
                            }}
                          >
                            Include links
                          </Label>
                        </div>
                      </TooltipButton>
                      {/* </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Include links to the articles at the bottom of the
                              notes
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider> */}
                    </div>
                    <div className="col-span-4 mb-6">
                      {selectedArticles.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedArticles.map(article => (
                            <div
                              key={article.id}
                              className="relative h-full w-fit opacity-90"
                            >
                              <ArticleComponent
                                onMouseEnter={() => setHoveredArticle(article)}
                                onMouseLeave={() => setHoveredArticle(null)}
                                key={article.id}
                                showShadowHover={false}
                                article={article}
                                size="small"
                                hoverLayout={() =>
                                  hoveredArticle?.id === article.id ? (
                                    <div className="absolute w-full h-full bg-black/50 flex items-center justify-center z-50">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleRemoveArticle(article.id)
                                        }
                                        className="bg-white/40"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : null
                                }
                                disabled
                              />
                              {/* Add X in the center of the article component to remove the article */}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground">
                          No articles selected
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => setShowArticleDialog(true)}
                      >
                        {selectedArticles.length > 0
                          ? "Change selection"
                          : "Select articles"}
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-4 relative mt-2">
                    <AutoAdjustTextArea
                      placeholder={
                        selectedSource === "posts"
                          ? "Additional details (optional)"
                          : "Additional topic (optional)"
                      }
                      maxRows={8}
                      className="w-full"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options Accordion */}
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="advanced" className="border rounded-lg">
                <AccordionTrigger
                  className={cn("px-4 hover:no-underline", {
                    "border-primary/10": hasAdvancedOptions,
                  })}
                  chevronClassName={cn({
                    "text-primary": hasAdvancedOptions,
                  })}
                >
                  <span
                    className={cn("text-sm font-medium", {
                      "text-primary": hasAdvancedOptions,
                    })}
                  >
                    Advanced Options
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4 pb-6 space-y-6">
                  <NoteLengthSection
                    enabled={noteLengthEnabled}
                    value={noteLength || null}
                    onEnabledChange={handleNotesLengthEnabledChange}
                    onValueChange={handleNotesLengthChange}
                  />

                  <NoteCountSection
                    enabled={noteCountEnabled}
                    value={noteCount}
                    defaultValue={notesToGenerate}
                    onEnabledChange={handleNotesCountEnabledChange}
                    onValueChange={handleNotesCountChange}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-row gap-0.5 mt-4 justify-end">
              <DialogTrigger asChild>
                <Button
                  type="submit"
                  className={cn({ "rounded-r-none": hasAdvancedGPT })}
                  disabled={
                    isLoadingGenerateNotes ||
                    (selectedSource === "posts" &&
                      selectedArticles.length === 0)
                  }
                >
                  {isLoadingGenerateNotes
                    ? "Generating..."
                    : selectedSource === "description"
                      ? topic
                        ? `Generate based on your topic (${noteCountEnabled ? noteCount : notesToGenerate})`
                        : `Generate personalized notes (${noteCountEnabled ? noteCount : notesToGenerate})`
                      : `Generate based on selected articles (${noteCountEnabled ? Math.min(noteCount, selectedArticles.length) : Math.min(notesToGenerate, selectedArticles.length)})`}
                </Button>
              </DialogTrigger>

              <AiModelsDropdown
                onModelChange={setSelectedModel}
                className="rounded-none bg-primary rounded-r-md"
                classNameTrigger="text-primary-foreground font-normal"
              />
            </div>
            <DialogFooter className="mt-4">
              <p className="text-[11px] text-muted-foreground absolute left-8 font-extralight">
                Notes will be generated in{" "}
                <span className="font-normal">
                  {languageValueToLabel(language)}
                </span>
              </p>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ArticleSelectionDialog
        open={showArticleDialog}
        onOpenChange={setShowArticleDialog}
        articles={articles}
        onArticlesSelected={handleArticlesSelected}
        loadMoreArticles={fetchNextArticlesPage}
        maxSelectedArticles={notesToGenerate}
        reloadArticles={() => {
          try {
            fetchPosts(1, true);
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        hasMoreArticles={hasMoreArticles}
        preSelectedArticles={selectedArticles}
        isLoading={isLoadingArticles}
      />

      <ToastStepper
        loadingStates={ideaLoadingStates}
        loading={isLoadingGenerateNotes}
        duration={4500}
        loop={false}
        position="bottom-right"
      />
    </>
  );
}
