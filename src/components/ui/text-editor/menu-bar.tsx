import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Sparkles,
  RefreshCcw,
  Save,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Idea } from "@/models/idea";
import { usePublication } from "@/lib/hooks/usePublication";
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
import { Publication } from "@/models/publication";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { toast } from "react-toastify";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { motion } from "framer-motion";

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
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
    </div>
    <span className="text-sm text-primary font-medium">AI is thinking...</span>
  </div>
);

interface MenuBarProps {
  editor: any;
  onOutlineUpdate: (idea: Idea) => void;
  publication: Publication | null;
  hasChanges: boolean;
  onSave: () => void;
}

export const MenuBar = ({
  editor,
  onOutlineUpdate,
  publication,
  hasChanges,
  onSave: handleSave,
}: MenuBarProps) => {
  const { generateIdeas } = usePublication();
  const { ideas } = useAppSelector(selectPublications);
  const { user } = useAppSelector(selectAuth);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [topic, setTopic] = useState("");

  const canGenerateIdeas = useMemo(() => {
    if (!user?.meta?.plan) return false;
    return user.meta.plan !== "free";
  }, [user?.meta?.plan]);

  const handleGenerateIdeas = async (topic?: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const ideas = await generateIdeas(topic);
      if (ideas.length > 0) {
        onOutlineUpdate(ideas[0]);
      }
    } catch (error: any) {
      console.error(error);
      if (error?.response?.status === 429) {
        setShowLimitDialog(true);
      } else {
        toast.error(
          "Something went wrong.. Try again please. Don't worry, we didn't take credits for it.",
        );
      }
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
      <div className="flex items-center justify-center gap-3 p-3 border-b">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Button
            variant={"outline"}
            onClick={handleSave}
            className="flex gap-2 transition-all duration-300"
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </motion.div>

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
        {publication ? (
          <Button
            size="lg"
            className="px-4 gap-2"
            onClick={handleGenerateButtonClick}
            disabled={isGenerating || !canGenerateIdeas || showLimitDialog}
          >
            {isGenerating ? (
              <AILoadingAnimation />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {canGenerateIdeas
                  ? showLimitDialog
                    ? "Daily limit reached"
                    : "Generate ideas"
                  : "Upgrade to generate ideas"}
              </>
            )}
          </Button>
        ) : (
          <CreatePublicationButton />
        )}
      </div>

      {isGenerating && (
        <MultiStepLoader
          loadingStates={ideaLoadingStates}
          loading={isGenerating}
          duration={10000}
          loop={false}
        />
      )}

      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <form onSubmit={handleDialogSubmit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Specify a Topic</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Enter a specific topic (optional)"
              value={topic}
              maxLength={200}
              onChange={e => setTopic(e.target.value)}
            />
            <DialogFooter>
              <Button type="submit" onClick={handleDialogSubmit}>
                Generate Ideas
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>

      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Daily Limit Reached</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You&apos;ve reached your daily limit for generating ideas. This
                helps us maintain quality and prevent abuse of our AI system.
              </p>
              <p>
                Your limit will reset in the next 24 hours, or you can upgrade
                your plan for higher limits and additional features.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogAction onClick={() => setShowLimitDialog(false)}>
              I&apos;ll wait
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link href="/settings/billing">Upgrade Plan</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
