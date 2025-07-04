"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ArticleComponent from "@/components/ui/article-component";
import { Article } from "@/types/article";
import { Check, RefreshCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: Article[];
  onArticlesSelected: (articles: Article[]) => void;
  loadMoreArticles: () => void;
  reloadArticles: () => void;
  hasMoreArticles: boolean;
  isLoading: boolean;
  preSelectedArticles?: Article[];
  maxSelectedArticles: number;
}

export function ArticleSelectionDialog({
  open,
  onOpenChange,
  articles,
  onArticlesSelected,
  loadMoreArticles,
  hasMoreArticles,
  reloadArticles,
  isLoading,
  preSelectedArticles,
  maxSelectedArticles,
}: ArticleSelectionDialogProps) {
  const [selectedArticles, setSelectedArticles] = useState<Article[]>(
    preSelectedArticles || [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);

  useEffect(() => {
    if (preSelectedArticles) {
      setSelectedArticles(preSelectedArticles);
    }
  }, [preSelectedArticles, open]);

  // Reset selected articles when the dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setFilteredArticles(articles);
    }
  }, [open, articles]);

  // Filter articles based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArticles(articles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = articles.filter(
      article =>
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query),
    );
    setFilteredArticles(filtered);
  }, [searchQuery, articles]);

  const toggleArticleSelection = (article: Article) => {
    if (selectedArticles.find(a => a.id === article.id)) {
      setSelectedArticles(selectedArticles.filter(a => a.id !== article.id));
    } else {
      if (selectedArticles.length < maxSelectedArticles) {
        setSelectedArticles([...selectedArticles, article]);
      }
    }
  };

  const handleSubmit = () => {
    onArticlesSelected(selectedArticles);
    onOpenChange(false);
  };

  const isArticleSelected = (article: Article) =>
    selectedArticles.some(a => a.id === article.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-4xl max-h-[90%] flex flex-col">
        <DialogHeader className="flex flex-col gap-4">
          <DialogTitle>Select up to {maxSelectedArticles} articles</DialogTitle>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </DialogHeader>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p
              className={cn("text-muted-foreground", {
                hidden: isLoading,
              })}
            >
              No articles found
            </p>
            <Button
              variant="outline"
              onClick={reloadArticles}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Loading..." : "Reload"}
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-grow pr-4 h-full overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 relative">
              {filteredArticles.map(article => {
                const isSelected = isArticleSelected(article);
                const isMaxReached =
                  selectedArticles.length >= maxSelectedArticles;

                return (
                  <div
                    key={article.id}
                    className={cn(
                      "relative transition-opacity duration-200",
                      !isSelected ? "opacity-70" : "opacity-100",
                      {
                        "hover:opacity-100": !isSelected && !isMaxReached,
                      },
                      isMaxReached && !isSelected && "opacity-50",
                    )}
                  >
                    <ArticleComponent
                      article={article}
                      onClick={() => toggleArticleSelection(article)}
                      size="xs"
                      showShadowHover={false}
                      className={
                        isMaxReached && !isSelected
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    />
                    <div
                      className={cn(
                        "absolute top-2 right-2 md:right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all border-2 cursor-pointer",
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-background/20 border-border/40 border",
                        isMaxReached && !isSelected
                          ? "hover:border-gray-400"
                          : "hover:border-primary",
                      )}
                      onClick={() => {
                        // Only allow deselection if max is reached
                        if (!isSelected && isMaxReached) return;
                        toggleArticleSelection(article);
                      }}
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasMoreArticles && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={loadMoreArticles}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Load more
                </Button>
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter className="flex !flex-col gap-4">
          <div className="w-full">
            <p className="text-muted-foreground mt-1 text-xs">
              Article reaction counts may be inaccurate.
            </p>
          </div>
          <div className="w-full flex flex-row !justify-between items-center mt-4">
            <div>
              {selectedArticles.length} of {maxSelectedArticles} articles
              selected
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedArticles.length === 0}
              >
                Use Selected Articles
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
