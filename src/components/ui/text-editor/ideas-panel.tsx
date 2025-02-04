import { Sparkles, ChevronRight } from "lucide-react";
import { Idea } from "@/models/idea";

interface IdeasPanelProps {
  ideas: Idea[];
  onSelectIdea: (idea: Idea, index: number) => void;
  onClose: () => void;
  loadingIdeaIndex: number | null;
  disabled: boolean;
}

// A small spinner for idea items.
const SmallLoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const IdeasPanel = ({
  ideas,
  onSelectIdea,
  onClose,
  loadingIdeaIndex,
  disabled,
}: IdeasPanelProps) => {
  if (ideas.length === 0) return null;
  return (
    <div className="fixed right-4 top-24 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Generated Ideas</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {ideas.map((idea: Idea, index: number) => {
          const isLoading = loadingIdeaIndex === index;
          // Disable if any idea is loading.
          const isDisabled = loadingIdeaIndex !== null || disabled;
          return (
            <button
              key={index}
              onClick={() => onSelectIdea(idea, index)}
              disabled={isDisabled}
              className={`w-full p-4 text-left border-b border-gray-100 transition-colors group flex items-center gap-2 ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex flex-col items-start gap-2">
                <h4 className="font-medium text-gray-900 mb-1 flex-1">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <SmallLoadingSpinner /> Loading...
                    </span>
                  ) : (
                    idea.title
                  )}
                </h4>
                <p className="text-sm text-gray-600">{idea.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
