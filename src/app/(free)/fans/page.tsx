"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import TopEngagers from "./components/top-engagers";
import DemoCard from "./components/demo-card";
import { Engager } from "@/types/engager";
import { Byline } from "@/types/article";
import axios from "axios";
import UrlAnalysisInput from "@/components/analysis/url-analysis-input";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Logger } from "@/logger";
import { usePathname, useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import useAuth from "@/lib/hooks/useAuth";

function TopEngagersPage() {
  const { data: session } = useSession();
  const router = useCustomRouter();
  const pathname = usePathname();
  const { signInWithGoogle, deleteUser } = useAuth();

  const [url, setUrl] = useState<string | null>(null);
  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);

  const [loadingUserData, setLoadingUserData] = useState(false);
  const loadingUserDataRef = useRef(loadingUserData);

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

  // Auto-fetch user data if logged in
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
    setLoading(true);

    try {
      // Get user publication data
      const publicationRes = await axios.get("/api/user/publication");
      setAuthorImage(publicationRes.data.image);
      setAuthorName(publicationRes.data.name);

      try {
        const fansRes = await axios.post(`/api/v1/top-engagers`, {
          authorId: authorId,
          url: url,
        });
        if (fansRes.data.success && fansRes.data.result?.length > 0) {
          setEngagers(fansRes.data.result);
          setHasAnalyzed(true);
        }
      } catch (error) {
        // Silently handle error, we'll show the input form
        Logger.error("Error fetching fans data:", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } catch (error) {
      // Silently handle error
      Logger.error("Error fetching user publication:", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
      setLoadingUserData(false);
      loadingUserDataRef.current = false;
    }
  };

  // Check for logged-in user on component mount
  useEffect(() => {
    if (loadingUserDataRef.current) return;
    if (engagers.length === 0) {
      fetchUserData();
    }
  }, [session]);

  // Calculate if input should be disabled
  const inputDisabled = useMemo(() => {
    return (
      loading ||
      loadingUserData ||
      (!!session?.user && !!authorName && engagers.length > 0)
    );
  }, [loading, loadingUserData, session?.user, authorName, engagers.length]);

  const handleBylineSelect = async (byline: Byline, forceAnalyze = false) => {
    setSelectedByline(byline);
    setLoading(true);
    setAuthorName(byline.name);
    setAuthorImage(byline.photoUrl);

    try {
      const response = await axios.post(`/api/v1/top-engagers`, {
        authorId: byline.authorId,
        url: url,
      });
      if (response.data.success && response.data.result?.length > 0) {
        setEngagers(response.data.result);
        setHasAnalyzed(true);
      } else {
        // Show login dialog for non-logged in users
        if (!session) {
          setShowLoginDialog(true);
          // Generate some mock data to show in background
          generateMockEngagers();
        } else {
          toast.info("No fans data found for this publication.");
          generateMockEngagers();
        }
      }
    } catch (error) {
      console.error("Error fetching top engagers:", error);
      toast.error("Failed to fetch top engagers. Please try again.");
      // For demonstration, generate some mock data
      // generateMockEngagers();
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration purposes
  const generateMockEngagers = () => {
    const mockEngagers: Engager[] = Array.from({ length: 10 }).map(
      (_, index) => ({
        authorId: `engager-${index}`,
        name: `Engager ${index + 1}`,
        photoUrl: `https://i.pravatar.cc/150?img=${index + 10}`,
        subscriberCount: Math.floor(Math.random() * 1000),
        subscriberCountString: Math.floor(Math.random() * 1000).toString(),
        score: Math.floor(Math.random() * 100),
        handle: `engager${index + 1}`,
      }),
    );
    setEngagers(mockEngagers);
    setHasAnalyzed(true);
  };

  const getLoginRedirect = () => {
    debugger;
    if (selectedByline) {
      return `${pathname}?redirect=fans&author=${selectedByline.authorId}`;
    } else {
      return `${pathname}?redirect=fans`;
    }
  };

  const handleDismissDialog = () => {
    setShowLoginDialog(false);
    setEngagers([]);
    setHasAnalyzed(false);
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

  const handleFanClick = (engager: Engager) => {
    router.push(`https://substack.com/@${engager.handle}`, {
      newTab: true,
    });
  };

  return (
    <div className="bg-background py-12 md:py-24 md:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">
            Find Your Top Substack Fans
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover who engages most with your Substack content
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card rounded-lg p-6 shadow-sm border mb-8"
        >
          <UrlAnalysisInput
            onBylineSelected={handleBylineSelect}
            isLoading={loading}
            hasData={hasAnalyzed}
            authorName={authorName}
            authorImage={authorImage}
            isInputDisabled={inputDisabled}
            placeholder="Your Substack URL (e.g., yourname.substack.com)"
            onUrlChange={setUrl}
          />
        </motion.div>

        {(hasAnalyzed || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <DemoCard title="Your Top Fans">
              <TopEngagers
                engagers={engagers}
                title="Your most loyal fans"
                className="mb-6 cursor-pointer"
                loading={loading}
                onClick={handleFanClick}
              />
            </DemoCard>
          </motion.div>
        )}

        {/* <footer className="mt-16 text-center text-sm text-muted-foreground">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Hover over any avatar to see more information about the engager
          </motion.p>
        </footer> */}
      </div>

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

export default TopEngagersPage;
