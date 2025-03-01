import { Button } from "@/components/ui/button";
import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { useAppSelector } from "@/lib/hooks/redux";
import { useIdea } from "@/lib/hooks/useIdea";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

export interface BlankPageProps {
  hasPublication: boolean;
}
export default function BlankPage({ hasPublication }: BlankPageProps) {
  const { createNewIdea } = useIdea();
  const { ideas } = useAppSelector(state => state.publications);
  const [loadingCreateNewIdea, setLoadingCreateNewIdea] = useState(false);

  const handleCreateNewIdea = () => {
    setLoadingCreateNewIdea(true);
    createNewIdea({ showIdeasAfterCreate: true }).finally(() =>
      setLoadingCreateNewIdea(false),
    );
  };

  const hasIdeas = useMemo(() => {
    return ideas.length > 0;
  }, [ideas]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] w-full">
      <div className="flex flex-col items-center justify-center h-full w-fit border border-border rounded-lg px-24 py-4">
        <h2 className="text-3xl font-bold mb-4 text-center">
          {!hasIdeas
            ? "This is the last blank page you'll see."
            : "Seems like you need a fresh start."}
        </h2>
        <div className="text-lg max-w-md text-center mb-1">
          {hasPublication ? (
            <div className="flex flex-col items-center justify-center">
              <p
                className={cn("mb-2", {
                  hidden: hasIdeas,
                })}
              >
                Let&apos;s start with generating your first idea.
              </p>
              <GenerateIdeasButton />
              <div
                className={cn(
                  "flex flex-col items-center justify-center mt-8",
                  {
                    "mt-2": hasIdeas,
                  },
                )}
              >
                <p
                  className={cn("mb-2", {
                    hidden: hasIdeas,
                  })}
                >
                  Or create a new idea from scratch and connect your Substack
                  later.
                </p>
                <Button
                  variant={hasIdeas ? "ghost" : "outline"}
                  onClick={handleCreateNewIdea}
                  disabled={loadingCreateNewIdea}
                >
                  {loadingCreateNewIdea ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create a draft
                </Button>
              </div>
            </div>
          ) : (
            <span>
              Connect your Substack account above or create a new draft.
              <br />
              <span className="text-muted-foreground">
                (You can always connect your Substack later through the
                settings)
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
