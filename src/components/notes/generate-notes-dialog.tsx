"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ChevronDown, Pencil, Sparkles, X } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { cn } from "@/lib/utils";
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

const ideaLoadingStates = [
  { text: "Finding relevant notes..." },
  { text: "Gathering inspiration from top notes..." },
  { text: "Putting together unique ideas..." },
  { text: "Finalizing the best notes..." },
];

export interface GenerateNotesDialogProps {}

type GenerateSource = "description" | "articles";

export function GenerateNotesDialog() {
  const params = useParams();
  const handle = params?.handle as string;

  const [topic, setTopic] = useState("");
  const { generateNewNotes, isLoadingGenerateNotes, errorGenerateNotes } =
    useNotes();
  const {
    articles,
    isLoadingArticles,
    hasMoreArticles,
    fetchPosts,
    fetchNextArticlesPage,
  } = useWriter(handle || "");

  const [selectedModel, setSelectedModel] = useState<FrontendModel>("auto");
  const [selectedSource, setSelectedSource] =
    useState<GenerateSource>("description");
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
    if (handle && selectedSource === "articles" && articles.length === 0) {
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
    } catch (e: any) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateNewNote();
  };

  const handleUpdateSelectedSource = (source: GenerateSource) => {
    setSelectedSource(source);
    if (source === "articles") {
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
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="neumorphic-primary"
            size="icon"
            className={cn(
              "md:hidden fixed h-12 w-12 bottom-20 right-4 z-50 transition-all duration-300 bg-background shadow-md border border-border hover:bg-background p-0",
            )}
          >
            <Pencil className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <TooltipButton
            tooltipContent="Generate personalized notes"
            variant="neumorphic-primary"
            // className="hidden md:flex"
          >
            <Sparkles size={16} className="h-4 w-4 mr-2" />
            Generate notes
          </TooltipButton>
        </DialogTrigger>

        <DialogContent className="overflow-auto sm:max-w-[625px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate new notes</DialogTitle>
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
                        ? "Your description"
                        : "Past articles"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => handleUpdateSelectedSource("description")}
                    >
                      Your description
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateSelectedSource("articles")}
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
                    <Input
                      id="topic"
                      placeholder="The topic of the notes (optional)"
                      className="w-full pr-20"
                      maxLength={200}
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />

                    <AiModelsDropdown
                      onModelChange={setSelectedModel}
                      className="absolute right-0 top-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-4">
                    Selected Articles ({selectedArticles.length}/3)
                  </Label>
                  <div className="col-span-4">
                    {selectedArticles.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedArticles.map(article => (
                          <div
                            key={article.id}
                            className="relative h-fit w-fit"
                          >
                            <ArticleComponent
                              onMouseEnter={() => setHoveredArticle(article)}
                              onMouseLeave={() => setHoveredArticle(null)}
                              key={article.id}
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
                  <div className="col-span-4 relative mt-2">
                    <Input
                      placeholder={
                        selectedSource === "articles"
                          ? "Additional info (optional)"
                          : "Additional topic (optional)"
                      }
                      className="w-full pr-20"
                      maxLength={200}
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />

                    <AiModelsDropdown
                      onModelChange={setSelectedModel}
                      className="absolute right-0 top-0"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  type="submit"
                  disabled={
                    isLoadingGenerateNotes ||
                    (selectedSource === "articles" &&
                      selectedArticles.length === 0)
                  }
                >
                  {isLoadingGenerateNotes
                    ? "Generating..."
                    : selectedSource === "description"
                      ? topic
                        ? "Generate based on your topic (3)"
                        : "Generate personalized notes (3)"
                      : "Generate based on selected articles (3)"}
                </Button>
              </DialogTrigger>
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
        duration={7500}
        loop={false}
        position="bottom-left"
      />
    </>
  );
}
