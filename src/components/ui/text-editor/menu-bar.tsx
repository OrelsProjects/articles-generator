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
  Loader,
  Loader2,
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
import { Separator } from "@/components/ui/separator";

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
  onSave: () => Promise<void>;
}

export const MenuBar = ({
  editor,
  onOutlineUpdate,
  publication,
  hasChanges,
  onSave,
}: MenuBarProps) => {
  const { generateIdeas } = usePublication();
  const { user } = useAppSelector(selectAuth);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleGenerateButtonClick = () => {
    setShowTopicDialog(true);
  };

  const handleDialogSubmit = () => {
    setShowTopicDialog(false);
    handleGenerateIdeas(topic);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.. Try again please.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <>
      <div className="flex items-center justify-start gap-2 p-2 border-b overflow-x-auto scrollbar-hide md:justify-center md:gap-3 md:p-3">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Undo className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Redo className="w-4 h-4 md:w-6 md:h-6" />
          </Button>{" "}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-8 md:h-10">
              Style
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
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

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("bold") && "bg-muted",
            )}
          >
            <Bold className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("italic") && "bg-muted",
            )}
          >
            <Italic className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("strike") && "bg-muted",
            )}
          >
            <Strikethrough className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("code") && "bg-muted",
            )}
          >
            <Code className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("bulletList") && "bg-muted",
            )}
          >
            <List className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 md:h-10 md:w-10",
              editor.isActive("orderedList") && "bg-muted",
            )}
          >
            <ListOrdered className="w-4 h-4 md:w-6 md:h-6" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          onClick={handleSave}
          className="flex gap-1 md:gap-2 h-8 md:h-10 px-2 md:px-4"
          disabled={!hasChanges}
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
          ) : (
            <Save className="w-3 h-3 md:w-4 md:h-4" />
          )}
          Save
        </Button>

        {publication && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              size="sm"
              className="px-2 md:px-4 gap-1 md:gap-2 h-8 md:h-10"
              onClick={handleGenerateButtonClick}
              disabled={isGenerating || !canGenerateIdeas || showLimitDialog}
            >
              {isGenerating ? (
                <AILoadingAnimation />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline">
                    {canGenerateIdeas
                      ? showLimitDialog
                        ? "Daily limit reached"
                        : "Generate ideas"
                      : "Upgrade to generate ideas"}
                  </span>
                  <span className="md:hidden">Generate</span>
                </>
              )}
            </Button>
          </>
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
