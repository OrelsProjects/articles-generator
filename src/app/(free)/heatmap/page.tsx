"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import ActivityHeatmap from "@/components/ui/activity-heatmap";
import { Streak } from "@/types/notes-stats";
import { appName } from "@/lib/consts";
import axios from "axios";
import { Byline } from "@/types/article";
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
import UrlAnalysisInput from "@/components/analysis/url-analysis-input";

export default function AnalyzeSubstack() {
  const { data: session } = useSession();
  const router = useCustomRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { signInWithGoogle } = useAuth();

  const [substackUrl, setSubstackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);

  const [loadingUserData, setLoadingUserData] = useState(false);
  const loadingUserDataRef = useRef(loadingUserData);

  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);

  const [streakData, setStreakData] = useState<Streak[]>([]);

  const getAuthorId = async () => {
    try {
      const response = await axios.get("/api/user/temp-author");
      return response.data;
    } catch (error) {
      Logger.error("Error fetching author ID:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  };

  const fetchUserData = async () => {
    if (loadingUserDataRef.current) return;

    let authorId = session?.user?.meta?.tempAuthorId;

    if (!authorId) {
      authorId = await getAuthorId();
    }
    if (!authorId) {
      return;
    }

    loadingUserDataRef.current = true;
    setLoadingUserData(true);
    setIsLoading(true);

    try {
      const publicationRes = await axios.get("/api/user/publication");

      setAuthorImage(publicationRes.data.image);
      setAuthorName(publicationRes.data.name);

      try {
        const streakRes = await axios.post<{ streakData: Streak[] }>(
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
    const isDisabled =
      isLoading ||
      loadingUserData ||
      (!!session?.user && !!substackUrl && streakData.length > 0);

    return isDisabled;
  }, [isLoading, loadingUserData, session?.user, substackUrl]);

  const handleBylineSelect = async (byline: Byline, forceAnalyze = false) => {
    setSelectedByline(byline);
    setIsLoading(true);

    try {
      const response = await axios.post<{
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
      return `${pathname}?redirect=heatmap&author=${selectedByline.authorId}`;
    } else {
      return `${pathname}?redirect=heatmap`;
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

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
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
        <UrlAnalysisInput
          onBylineSelected={handleBylineSelect}
          isLoading={isLoading}
          hasData={hasAnalyzed || streakData.length > 0}
          authorName={authorName}
          authorImage={authorImage}
          isInputDisabled={inputDisabled}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-4 relative">
          <h2 className="text-2xl font-bold">Your Notes Activity Heatmap</h2>
        </div>
        <div className="relative">
          {!hasAnalyzed && !session?.user && (
            <div className="absolute w-full h-full top-0 right-0 bg-black/40 rounded-lg" />
          )}
          <ActivityHeatmap
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
                {authorName && <span className="ml-1"> for {authorName}</span>}
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
                    .post<{ streakData: Streak[] }>(
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
    </div>
  );
}
