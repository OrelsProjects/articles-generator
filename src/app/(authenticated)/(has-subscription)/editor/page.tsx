"use client";

import { IdeasPanel } from "@/components/ui/text-editor/ideas-panel";
import TextEditor from "@/components/ui/text-editor/text-editor";
import { useAppSelector } from "@/lib/hooks/redux";
import { Idea } from "@/types/idea";
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowLeft, Star, CheckCircle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/app/(authenticated)/(has-subscription)/editor/header";
import LoadingIdeas from "@/components/ui/loading-ideas";
import GenerateIdeasDialog from "@/components/ui/generate-ideas-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NewArticleDropdown from "@/components/ui/new-article-dropdown";
import { usePublication } from "@/lib/hooks/usePublication";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useIdea } from "@/lib/hooks/useIdea";
import { IdeaStatus } from "@prisma/client";

// Articles Grid Component
const ArticlesGrid = ({
  onSelectIdea,
  onCreateNew,
}: {
  onSelectIdea: (idea: Idea) => void;
  onCreateNew: () => void;
}) => {
  const { ideas } = useAppSelector(state => state.publications);
  const {} = usePublication();
  const { updateStatus } = useIdea();
  const [currentTab, setCurrentTab] = useState<
    "new" | "used" | "archived" | "all"
  >("new");

  const onChangeStatus = (ideaId: string, status: IdeaStatus | "favorite") => {
    updateStatus(ideaId, status);
  };

  const filteredIdeas = ideas.filter(idea => {
    switch (currentTab) {
      case "new":
        return idea.status === "new";
      case "used":
        return idea.status === "used";
      case "archived":
        return idea.status === "archived";
      case "all":
        return true;
      default:
        return true;
    }
  });

  const sortedIdeas = filteredIdeas.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="w-full h-full bg-background">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Articles</h1>
          <NewArticleDropdown />
        </div>

        <Tabs
          value={currentTab}
          onValueChange={value => setCurrentTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="used">Used</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab} className="mt-0">
            {sortedIdeas.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedIdeas.map(idea => (
                  <Card 
                    key={idea.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors h-52 flex flex-col group"
                    onClick={() => onSelectIdea(idea)}
                  >
                    <CardHeader className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {idea.title || "Untitled"}
                        </CardTitle>
                        <Badge
                          variant={
                            idea.status === "new"
                              ? "default"
                              : idea.status === "used"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {idea.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {idea.subtitle || "No subtitle"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-1 self-end transition-opacity pb-2">
                      <TooltipButton
                        tooltipContent="Add to favorites"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChangeStatus(idea.id, "favorite");
                        }}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            idea.isFavorite && "text-primary",
                          )}
                        />
                      </TooltipButton>
                      <TooltipButton
                        tooltipContent="Article idea was used"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChangeStatus(idea.id, "used");
                        }}
                      >
                        <CheckCircle
                          className={cn(
                            "h-4 w-4",
                            idea.status === "used" && "text-primary",
                          )}
                        />
                      </TooltipButton>
                      <TooltipButton
                        tooltipContent="Archive idea"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChangeStatus(idea.id, "archived");
                        }}
                      >
                        <Archive
                          className={cn(
                            "h-4 w-4",
                            idea.status === "archived" && "text-primary",
                          )}
                        />
                      </TooltipButton>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No articles found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {currentTab === "new"
                    ? "You don't have any new articles yet. Create your first one to get started."
                    : `No ${currentTab} articles found. Try switching to a different tab.`}
                </p>
                <NewArticleDropdown />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const MobilesIdeasPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIdea = (_: Idea) => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          variant="default"
          className={cn(
            "md:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg p-0",
            "flex items-center justify-center",
            isOpen && "hidden",
          )}
        >
          <Lightbulb className="h-6 w-6 text-primary-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetTitle className="sr-only">Ideas</SheetTitle>
        <IdeasPanel
          onSelectIdea={handleSelectIdea}
          onClose={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

export default function EditorPage() {
  const [draftStatus, setDraftStatus] = useState<{
    error: boolean;
    saving: boolean;
  }>({ error: false, saving: false });

  const [viewMode, setViewMode] = useState<"articles" | "editor">("articles");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const { publications } = useAppSelector(state => state.publications);

  const handleDraftStatusChange = (error?: boolean, saving?: boolean) => {
    setDraftStatus({ error: error || false, saving: saving || false });
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setViewMode("editor");
  };

  const handleBackToArticles = () => {
    setViewMode("articles");
    setSelectedIdea(null);
  };

  const handleCreateNew = () => {
    // Create a new draft idea and switch to editor
    const now = new Date();
    const newIdea: Idea = {
      id: `draft-${Date.now()}`,
      topic: "",
      title: "",
      subtitle: "",
      description: "",
      outline: "",
      inspiration: "",
      image: "",
      search: false,
      didUserSee: false,
      body: "",
      bodyHistory: [],
      status: "new",
      isFavorite: false,
      modelUsedForIdeas: "",
      modelUsedForOutline: "",
      updatedAt: now,
    };
    setSelectedIdea(newIdea);
    setViewMode("editor");
  };

  return (
    <div className="w-full max-w-screen h-screen flex flex-col items-center overflow-clip relative">
      <GenerateIdeasDialog />
      <Header draftStatus={draftStatus} />

      {viewMode === "articles" ? (
        <ArticlesGrid
          onSelectIdea={handleSelectIdea}
          onCreateNew={handleCreateNew}
        />
      ) : (
        <div className="h-full w-full flex flex-col">
          {/* Back button */}
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              onClick={handleBackToArticles}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <TextEditor
              publication={publications[0]}
              onDraftStatusChange={handleDraftStatusChange}
            />
          </div>
        </div>
      )}

      <LoadingIdeas />

      {/* Mobile Ideas Panel - only show in articles view */}
      {viewMode === "articles" && <MobilesIdeasPanel />}
    </div>
  );
}
