import { Sparkles, Star, CheckCircle, Archive, SearchX, X } from "lucide-react";
import { IdeaStatus } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Idea } from "@/types/idea";
import { useState, useMemo, useEffect, useRef } from "react";
import { useIdea } from "@/lib/hooks/useIdea";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useAppSelector } from "@/lib/hooks/redux";
import { EmptyIdeas } from "@/components/ui/text-editor/empty-ideas";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface IdeasPanelProps {
  onSelectIdea?: (idea: Idea) => void;
}

type TabValue = "new" | "archived" | "all" | "used";

export const IdeasPanel = ({ onSelectIdea }: IdeasPanelProps) => {
  const { updateStatus, setSelectedIdea } = useIdea();
  const { selectedIdea, ideas, loadingNewIdeas } = useAppSelector(
    state => state.publications,
  );
  const [currentTab, setCurrentTab] = useState<TabValue>("new");
  const [showFavorites, setShowFavorites] = useState(false);
  const [isFirstInit, setIsFirstInit] = useState(true);
  const ideasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedIdea) return;
    if (isFirstInit) {
      setIsFirstInit(false);
      // scroll to the selected idea
      const ideaElement = document.getElementById(selectedIdea.id);
      if (ideaElement) {
        // scroll with margin top 8px
        ideaElement.scrollIntoView({
          behavior: "instant",
          block: "start",
          inline: "nearest",
        });
        ideasContainerRef.current?.scrollBy(0, -48);
      }
    }
  }, [isFirstInit, setSelectedIdea]);

  const onChangeStatus = (ideaId: string, status: IdeaStatus | "favorite") => {
    updateStatus(ideaId, status);
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    onSelectIdea?.(idea);
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      if (showFavorites && !idea.isFavorite) return false;

      switch (currentTab) {
        case "new":
          return idea.status === "new";
        case "archived":
          return idea.status === "archived";
        case "used":
          return idea.status === "used";
        case "all":
          return true;
      }
    });
  }, [ideas, showFavorites, currentTab]);

  const sortedIdeas = useMemo(() => {
    return filteredIdeas.sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );
  }, [filteredIdeas]);

  return (
    <motion.div className="w-full h-full border-l">
      <div className="h-full w-full space-y-4">
        <div
          id="ideas-panel-header"
          className="flex items-center justify-center mt-2 md:mt-0 md:justify-start gap-4 p-4 border-b"
        >
          <Sparkles className="h-4 w-4" />
          <h2 className="text-2xl font-bold">Generated Ideas</h2>
        </div>
        {ideas.length > 0 || loadingNewIdeas ? (
          <div className="h-full w-full pt-2">
            <div id="ideas-panel-tabs" className="w-full px-8 space-y-4">
              <div className="w-full flex items-center justify-between">
                <Tabs
                  defaultValue="new"
                  value={currentTab}
                  onValueChange={value => setCurrentTab(value as TabValue)}
                >
                  <TabsList>
                    <TabsTrigger value="new">New</TabsTrigger>
                    <TabsTrigger value="used">Used</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorites"
                    checked={showFavorites}
                    onCheckedChange={setShowFavorites}
                  />
                  <Label
                    htmlFor="favorites"
                    className="flex items-center gap-1"
                  >
                    Favorites
                  </Label>
                </div>
              </div>
            </div>

            <div id="ideas-panel-ideas" className="h-full pb-36 px-0.5">
              <ScrollArea
                className="h-full space-y-4 pb-4 scroll-pl-8"
                ref={ideasContainerRef}
              >
                {sortedIdeas.length > 0 || loadingNewIdeas ? (
                  <div className="space-y-4 px-8">
                    {sortedIdeas.map(idea => (
                      <Card
                        key={idea.id}
                        id={idea.id}
                        className={cn(
                          "w-full h-40 transition-colors cursor-pointer hover:bg-muted/50 group flex flex-col justify-between",
                          selectedIdea?.id === idea.id &&
                            "border border-primary transition-all duration-300",
                        )}
                        onClick={() => handleSelectIdea(idea)}
                      >
                        <CardHeader className="pt-2">
                          <div className="flex flex-col items-start justify-between gap-2">
                            <>
                              <CardTitle className="text-lg line-clamp-2">
                                {idea.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {idea.subtitle}
                              </p>
                            </>
                          </div>
                        </CardHeader>
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
                    {loadingNewIdeas &&
                      Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="w-full h-40 rounded-lg"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
                    <SearchX className="h-12 w-12" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No ideas found</h3>
                      <p className="text-sm">
                        {showFavorites
                          ? "No favorite ideas found in the current view. Try changing filters or marking some ideas as favorites."
                          : currentTab === "archived"
                            ? "No archived ideas found. Archive some ideas to see them here."
                            : "No ideas match your current filters. Try adjusting them to see more ideas."}
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <EmptyIdeas />
        )}
      </div>
    </motion.div>
  );
};
