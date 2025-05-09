"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import Logo from "@/components/ui/logo";
import ActivityHeatmap from "@/components/ui/activity-heatmap";
import { Streak } from "@/types/notes-stats";
import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  X,
  User,
} from "lucide-react";
import { appName } from "@/lib/consts";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { validateSubstackUrl, validateUrl } from "@/lib/utils/url";
import axios from "axios";
import { Byline } from "@/types/article";
import { AuthorSelectionDialog } from "@/components/onboarding/author-selection-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { MotionAlert } from "@/components/ui/motion-components";
import { AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import { Logger } from "@/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePathname, useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { FcGoogle } from "react-icons/fc";
import useAuth from "@/lib/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ERRORS = {
  INVALID_URL: {
    value: "URL is invalid 🤔",
    type: "warn" as const,
    explanation:
      "Make sure your URL follows the format: your-blog.substack.com",
  },
  INVALID_SUBSTACK_URL: {
    value: "Something's wrong with your URL 🤔",
    type: "warn" as const,
    explanation:
      "A valid URL looks like this: <strong>your-blog.substack.com</strong> or <strong>your-blog.com/co/ai/etc</strong>",
  },
  PUBLICATION_NOT_FOUND: {
    value: "Publication not found 🤔",
    type: "warn" as const,
    explanation: "Please check your URL and try again.",
  },
  GENERAL_ERROR: {
    value: "Something went wrong while analyzing your publication",
    type: "error" as const,
    explanation: "Please try again. If the problem persists, contact support.",
  },
};

interface ErrorState {
  value: string;
  type: "error" | "warn";
  explanation: string;
}

export default function AnalyzeSubstack() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useCustomRouter();
  const searchParams = useSearchParams();

  const { signInWithGoogle } = useAuth();

  const [substackUrl, setSubstackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const [error, setError] = useState<ErrorState | null>(null);
  const [loadingBylines, setLoadingBylines] = useState(false);
  const [bylines, setBylines] = useState<Byline[]>([]);
  const [openAuthorSelectionDialog, setOpenAuthorSelectionDialog] =
    useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);

  const [loadingUserData, setLoadingUserData] = useState(false);
  const loadingUserDataRef = useRef(loadingUserData);

  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);

  const [streakData, setStreakData] = useState<Streak[]>([]);

  const authorId = searchParams.get("author");

  useEffect(() => {
    if (authorId) {
      router.push(pathname, {
        paramsToRemove: ["author"],
      });
    }
  }, [authorId]);

  const fetchUserData = async () => {
    loadingUserDataRef.current = true;
    setLoadingUserData(true);
    setIsLoading(true);

    try {
      const publicationRes = await axios.get("/api/user/publication");

      setAuthorImage(publicationRes.data.image);
      setAuthorName(publicationRes.data.name);

      try {
        const streakRes = await axios.get<{ streakData: Streak[] }>(
          `/api/analyze-substack/${session?.user?.meta?.tempAuthorId || "null"}`,
        );
        setStreakData(streakRes.data.streakData);
      } catch (error) {
        // do nothing
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      // do nothing
    } finally {
      setIsLoading(false);
      setLoadingUserData(false);
      loadingUserDataRef.current = false;
    }
  };

  useEffect(() => {
    if (loadingUserDataRef.current) return;
    if (session?.user && streakData.length === 0) {
      fetchUserData();
    }
  }, [session]);

  const inputDisabled = useMemo(() => {
    return (
      isLoading ||
      loadingBylines ||
      loadingUserData ||
      (!!session?.user && !!substackUrl && streakData.length > 0)
    );
  }, [isLoading, loadingBylines, loadingUserData, session?.user, substackUrl]);

  const validatePublication = async (url: string) => {
    try {
      const res = await axios.get(`/api/user/analyze/validate?q=${url}`);
      return res.data;
    } catch (error) {
      console.error("Error validating publication: " + url, error);
      return { valid: false, hasPublication: false };
    }
  };

  const getBylines = async () => {
    if (isLoading || loadingBylines) return;

    if (!validateUrl(substackUrl)) {
      setError(ERRORS.INVALID_URL);
      return;
    }

    if (!validateSubstackUrl(substackUrl)) {
      setError(ERRORS.INVALID_SUBSTACK_URL);
      return;
    }

    setError(null);
    setLoadingBylines(true);

    try {
      const { valid, validUrl } = await validatePublication(substackUrl);

      if (!valid) {
        setError(ERRORS.INVALID_SUBSTACK_URL);
        return;
      }

      if (validUrl) {
        setSubstackUrl(validUrl);
      }

      const response = await axios.get(
        `/api/publication/bylines?url=${validUrl || substackUrl}`,
      );

      setBylines(response.data || []);
      setOpenAuthorSelectionDialog(true);
    } catch (error) {
      console.error("Failed to fetch bylines:", error);
      toast.error("Failed to fetch bylines");
      setBylines([]);
      setError(ERRORS.GENERAL_ERROR);
    } finally {
      setLoadingBylines(false);
    }
  };

  const handleBylineSelect = async (byline: Byline, forceAnalyze = false) => {
    setSelectedByline(byline);
    setOpenAuthorSelectionDialog(false);
    setIsLoading(true);

    try {
      const response = await axios.get<{
        success: boolean;
        streakData: Streak[];
      }>(`/api/analyze-substack/${byline.authorId}`);
      if (response.data.success) {
        if (response.data.streakData) {
          setStreakData(response.data.streakData);
          setHasAnalyzed(true);
        } else {
          // Show login dialog for non-logged in users
          if (!session) {
            setShowLoginDialog(true);
            // Generate some mock data to show in the background
            const { streakData: mockData } = generateMockData();
            setStreakData(mockData);
          }
        }
      }
    } catch (error: any) {
      Logger.error("Error analyzing Substack:", {
        authorId: byline.authorId,
        error,
      });
      toast.error(
        "There was an error analyzing your Substack. Please try again.",
      );
      setHasAnalyzed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getLoginRedirect = () => {
    if (selectedByline) {
      return `/login?redirect=heatmap&author=${selectedByline.authorId}`;
    } else {
      return `/login?redirect=heatmap`;
    }
  };

  const handleDismissDialog = () => {
    setShowLoginDialog(false);
    setStreakData([]);
    setHasAnalyzed(false);
  };

  // Mock data generator - remove in production
  const generateMockData = () => {
    const streakData: Streak[] = [];
    const today = new Date();
    let streakCount = 0;

    // Generate data for the last 180 days
    for (let i = 180; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Random activity between 0-5 notes, with higher probability for 0
      const noteCount =
        Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;

      if (noteCount > 0 && i <= 30) {
        streakCount++;
      }

      if (noteCount > 0) {
        streakData.push({
          year: date.getFullYear().toString(),
          month: (date.getMonth() + 1).toString().padStart(2, "0"),
          day: date.getDate().toString().padStart(2, "0"),
          notes: noteCount,
        });
      }
    }

    return { streakData, streakCount };
  };

  const handleCloseLoginDialog = (open: boolean) => {
    setShowLoginDialog(open);
    if (!open) {
      handleDismissDialog();
    }
  };

  const handleSignIn = () => {
    signInWithGoogle(getLoginRedirect());
  };

  const ActivityHeader = () => (
    <div className="flex items-center gap-4 justify-center">
      <div className="h-14 w-14 rounded-full overflow-hidden">
        <Avatar className="h-14 w-14 rounded-full">
          <AvatarImage src={authorImage || ""} alt="User" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
      <h3 className="text-xl font-medium">
        {authorName || ""}&apos;s Substack Activity
      </h3>
    </div>
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="w-full flex justify-center bg-background backdrop-blur border-b border-border">
          <div className="container flex items-center justify-between py-4 px-6 md:px-0 md:py-6 xl:px-20 mx-auto">
            <div className="flex gap-6 md:gap-10">
              <Link href="/">
                <Logo textClassName="font-bold text-xl" />
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/">
                  <span className="hidden md:flex">Start growing now</span>
                  <span className="flex md:hidden">Start now</span>
                  <ArrowRight className="ml-2" size={16} strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">
              Analyze Your Substack Activity
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enter your Substack URL below to see your posting activity and
              understand your writing habits.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card rounded-lg p-6 shadow-sm border mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Your Substack URL (e.g., yourname.substack.com)"
                value={substackUrl}
                onChange={e => setSubstackUrl(e.target.value)}
                className="flex-1"
                disabled={inputDisabled}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectedByline) {
                      handleBylineSelect(selectedByline);
                    } else {
                      getBylines();
                    }
                  }
                }}
              />
              <Button
                variant={"outline"}
                onClick={() => {
                  if (selectedByline) {
                    handleBylineSelect(selectedByline);
                  } else {
                    getBylines();
                  }
                }}
                disabled={isLoading || loadingBylines || !substackUrl}
              >
                {loadingBylines
                  ? "Looking up authors..."
                  : isLoading
                    ? "Analyzing..."
                    : "Analyze Activity"}
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {error?.value && (
                <MotionAlert
                  key={error.value}
                  variant={error.type === "error" ? "destructive" : "warning"}
                  className="flex flex-row items-center pb-1.5 pr-2 mt-4"
                >
                  {error.type === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription className="flex-1 leading-7 ml-2">
                    {error.value}
                  </AlertDescription>
                  <TooltipProvider delayDuration={350}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full !p-0 !pb-1.5"
                          type="button"
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p
                          className="text-sm"
                          dangerouslySetInnerHTML={{
                            __html: error.explanation,
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </MotionAlert>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-4 relative">
              <h2 className="text-2xl font-bold">
                Your Notes Activity Heatmap
              </h2>
            </div>
            <div className="relative">
              {!hasAnalyzed && !session?.user && (
                <div className="absolute w-full h-full top-0 right-0 bg-black/40 rounded-lg" />
              )}
              <ActivityHeatmap
                // shareHeader={
                //   <div className="w-full flex justify-center">
                //     <ActivityHeader />
                //   </div>
                // }
                streakData={streakData || []}
                loading={isLoading}
                showShare={hasAnalyzed || !!session?.user}
                shareVariant="neumorphic-primary"
                shareCaption={
                  <div className="w-full mt-2 text-center text-sm text-muted-foreground flex items-center justify-center">
                    <span>Generated by </span>
                    <span className="font-semibold ml-1">
                      writestack.io/heatmap
                    </span>
                    {selectedByline && !authorName && (
                      <span className="ml-1"> for {selectedByline.name}</span>
                    )}
                    {authorName && (
                      <span className="ml-1"> for {authorName}</span>
                    )}
                  </div>
                }
              />
            </div>

            {(hasAnalyzed && selectedByline) ||
            session?.user?.meta?.tempAuthorId ? (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedByline) {
                      handleBylineSelect(selectedByline, true);
                    } else if (session?.user?.meta?.tempAuthorId) {
                      setIsLoading(true);
                      axios
                        .get<{ streakData: Streak[] }>(
                          `/api/analyze-substack/${session.user.meta.tempAuthorId}?refresh=true`,
                        )
                        .then(res => {
                          setStreakData(res.data.streakData);
                          toast.success("Data refreshed successfully");
                        })
                        .catch(err => {
                          Logger.error("Error refreshing data", err);
                          toast.error("Failed to refresh data");
                        })
                        .finally(() => {
                          setIsLoading(false);
                        });
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                  </svg>
                  Refresh Data
                </Button>
              </div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-primary/5 rounded-lg p-8 border border-primary/40 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              Want more out of your Substack?
            </h2>
            <p className="text-lg mb-6">
              {appName} helps you grow your audience through consistent posting,
              viral content, scheduling and much more.
            </p>
            <Button size="lg" asChild>
              <Link href="/">Try {appName} For Free</Link>
            </Button>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-muted py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {appName}. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This website is not affiliated or partnered with Substack.
            </p>
          </div>
        </footer>
      </div>

      {/* Author Selection Dialog */}
      <AuthorSelectionDialog
        open={openAuthorSelectionDialog}
        onOpenChange={setOpenAuthorSelectionDialog}
        bylines={bylines}
        onSelect={handleBylineSelect}
      />

      <Dialog open={showLoginDialog} onOpenChange={handleCloseLoginDialog}>
        <DialogContent className="sm:max-w-md" backgroundBlur={false}>
          <DialogHeader>
            <DialogTitle>Login to see your results</DialogTitle>
            <DialogDescription>
              To avoid abuse and keep this tool a unique experience, I&apos;ll
              need you to quickly sign up (Less than 10 seconds).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 pb-6">
            <div className="grid flex-1 gap-2">
              <p className="text-sm text-muted-foreground">
                With a free account, you&apos;ll be able to use all current and
                future free tools.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={handleSignIn}
              className="w-full py-6 text-lg font-semibold transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <FcGoogle className="mr-2 h-6 w-6" /> Sign in with Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
