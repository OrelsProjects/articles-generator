"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
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
  onOpenChange,
  onClick,
  defaultOpen,
  defaultSource,
  tooltip = true,
  variant = "default",
}: GenerateNotesDialogProps) {
  const params = useParams();
  const handle = params?.handle as string;
  const { hasAdvancedGPT } = useUi();

  const [topic, setTopic] = useState("");
  const [open, setOpen] = useState(defaultOpen || false);
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

  useEffect(() => {
    if (errorGenerateNotes) {
      toast.error(errorGenerateNotes);
    }
  }, [errorGenerateNotes]);

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
      // Different logic based on source
      if (selectedSource === "description") {
        await generateNewNotes(selectedModel, {
          topic,
        });
      } else {
        // Using articles
        await generateNewNotes(selectedModel, {
          topic,
          preSelectedPostIds: selectedArticles.map(article => article.id),
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

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

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={open => {
          setOpen(open);
          onOpenChange?.(open);
        }}
      >
        <DialogTrigger asChild onClick={onClick}>
          <TooltipButton
            hideTooltip={!tooltip}
            tooltipContent="Generate personalized notes"
            className={cn(
              "px-2",
              variant === "default"
                ? ""
                : " flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground ",
            )}
            variant={variant === "default" ? "neumorphic-primary" : variant}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate notes
          </TooltipButton>
        </DialogTrigger>

        <DialogContent className="overflow-auto sm:max-w-[625px] max-h-[88vh]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate new notes</DialogTitle>
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
            <div className="grid gap-4 py-4">
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
                    Topic
                  </Label>
                  <div className="col-span-4 relative">
                    <AutoAdjustTextArea
                      id="topic"
                      placeholder="Describe the topic you want AI to write about (optional)."
                      className="w-full"
                      value={topic}
                      maxRows={8}
                      onChange={e => setTopic(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full items-center gap-4">
                  <div className="w-full bg-muted-foreground/5 rounded-md p-4 space-y-2 mb-6">
                    <Label className="col-span-4">
                      Selected Articles ({selectedArticles.length}/
                      {notesToGenerate})
                    </Label>
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
            <DialogFooter className="mt-4">
              <div className="flex flex-row gap-0.5">
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
                          ? `Generate based on your topic (${notesToGenerate})`
                          : `Generate personalized notes (${notesToGenerate})`
                        : `Generate based on selected articles (${notesToGenerate})`}
                  </Button>
                </DialogTrigger>

                <AiModelsDropdown
                  onModelChange={setSelectedModel}
                  className="rounded-none bg-primary rounded-r-md"
                  classNameTrigger="text-primary-foreground font-normal"
                />
              </div>
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
        position="bottom-left"
      />
    </>
  );
}
