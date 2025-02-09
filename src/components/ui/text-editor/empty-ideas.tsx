import { Button } from "@/components/ui/button";
import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { Sparkles } from "lucide-react";

export function EmptyIdeas() {
  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-start p-8 text-center space-y-4">
      <h3 className="text-xl font-semibold">No ideas generated yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Generate your first batch of ideas based on your publication&apos;s
        style and content.
      </p>
      <GenerateIdeasButton 
        variant="default"
        size="lg"
        className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        buttonContent={
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            <span>Generate Ideas</span>
          </>
        }
      />
    </div>
  );
}
