import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  LinkIcon,
  ImageIcon,
  Headphones,
  Video,
  MessageSquare,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Idea } from "@/models/idea";
import { usePublication } from "@/lib/hooks/usePublication";
import { IdeasPanel } from "@/components/ui/text-editor/ideas-panel";
import { CreatePublicationButton } from "@/components/ui/text-editor/create-publication-button";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Define loading states for generating ideas
const ideaLoadingStates = [
  { text: "Analyzing publication style..." },
  { text: "Gathering inspiration from top articles..." },
  { text: "Crafting unique article ideas..." },
  { text: "Refining ideas for clarity and impact..." },
  { text: "Finalizing the best ideas..." },
];

// A loading animation for the AI "thinking" indicator.
const AILoadingAnimation = () => (
  <div className="flex items-center gap-2 px-3 py-1.5">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
    </div>
    <span className="text-sm text-blue-500 font-medium">AI is thinking...</span>
  </div>
);

interface MenuBarProps {
  editor: any;
  onOutlineUpdate: (idea: Idea) => void;
  publicationId: string | null;
}

export const MenuBar = ({
  editor,
  onOutlineUpdate,
  publicationId,
}: MenuBarProps) => {
  const { generateIdeas } = usePublication();
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [topic, setTopic] = useState("");

  const handleGenerateIdeas = async (topic?: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setShowIdeas(true);
    try {
      const ideas = await generateIdeas(topic);
      setIdeas(ideas);
      if (ideas.length > 0) {
        onOutlineUpdate(ideas[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = async (idea: Idea) => {
    onOutlineUpdate(idea);
  };

  const handleGenerateButtonClick = () => {
    setShowTopicDialog(true);
  };

  const handleDialogSubmit = () => {
    setShowTopicDialog(false);
    handleGenerateIdeas(topic);
  };

  if (!editor) return null;

  return (
    <>
      <div className="flex items-center justify-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCcw className="w-6 h-6" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              Style
              <ChevronDown className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              Heading 2
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive("bold") && "bg-muted")}
          >
            <Bold className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive("italic") && "bg-muted")}
          >
            <Italic className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(editor.isActive("strike") && "bg-muted")}
          >
            <Strikethrough className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive("code") && "bg-muted")}
          >
            <Code className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <LinkIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <ImageIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Headphones className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive("bulletList") && "bg-muted")}
          >
            <List className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive("orderedList") && "bg-muted")}
          >
            <ListOrdered className="w-6 h-6" />
          </Button>
        </div>
        {publicationId ? (
          <Button
            variant="ghost"
            size="lg"
            className="px-4 gap-2"
            onClick={handleGenerateButtonClick}
            disabled={isGenerating || !publicationId}
          >
            {isGenerating ? (
              <AILoadingAnimation />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Ideas
              </>
            )}
          </Button>
        ) : (
          <CreatePublicationButton />
        )}
      </div>

      {showIdeas && (
        <IdeasPanel
          ideas={ideas}
          onSelectIdea={handleSelectIdea}
          onClose={() => setShowIdeas(false)}
          disabled={isGenerating}
        />
      )}

      {isGenerating && (
        <MultiStepLoader
          loadingStates={ideaLoadingStates}
          loading={isGenerating}
          duration={10000}
          loop={false}
        />
      )}

      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Specify a Topic</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter a specific topic (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleDialogSubmit}>Generate Ideas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
