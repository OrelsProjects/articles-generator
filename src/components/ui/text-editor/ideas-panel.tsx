import { Sparkles, Star, CheckCircle, Archive, SearchX } from "lucide-react";
import { IdeaStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Idea } from "@/models/idea";
import { useState } from "react";
import { useIdea } from "@/lib/hooks/useIdea";
import { TooltipButton } from "@/components/ui/tooltip-button";

interface IdeasPanelProps {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

type TabValue = "new" | "archived" | "all" | "used";

export const IdeasPanel = ({ ideas, onSelectIdea }: IdeasPanelProps) => {
  const { updateStatus } = useIdea();
  const [currentTab, setCurrentTab] = useState<TabValue>("new");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(ideas[0]);

  if (ideas.length === 0) return null;

  const onChangeStatus = (ideaId: string, status: IdeaStatus | "favorite") => {
    updateStatus(ideaId, status);
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    onSelectIdea(idea);
  };

  const filteredIdeas = ideas.filter(idea => {
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

  return (
    <div className="w-full border-l h-full">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 px-4">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-2xl font-bold">Generated Ideas</h2>
          </div>
        </div>

        <div className="w-full px-8 space-y-4">
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
              <Label htmlFor="favorites" className="flex items-center gap-1">
                <Star className="h-4 w-4" /> Favorites only
              </Label>
            </div>
          </div>
        </div>

        <ScrollArea className="h-screen px-8 pb-24">
          <div className="space-y-4">
            {filteredIdeas.length > 0 ? (
              <div className="space-y-4">
                {filteredIdeas.map((idea, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "transition-colors cursor-pointer hover:bg-muted/50 group",
                      selectedIdea?.id === idea.id &&
                        "border border-primary transition-all duration-300",
                    )}
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {idea.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {idea.subtitle}
                          </p>
                        </div>
                        <div className="flex gap-1 transition-opacity">
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
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm">{idea.description}</p>
                      </div>
                    </CardContent>
                  </Card>
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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
