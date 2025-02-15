import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import MainActionButton from "@/components/ui/main-action-button";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { useAppSelector } from "@/lib/hooks/redux";

export function EmptyIdeas() {
  const { publications } = useAppSelector(state => state.publications);

  const publication = publications[0];

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-start p-8 text-center space-y-4">
      <h3 className="text-xl font-semibold">No ideas generated yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Generate your first batch of ideas based on your publication&apos;s
        style and content.
      </p>
      <MainActionButton publication={publication} />
    </div>
  );
}
