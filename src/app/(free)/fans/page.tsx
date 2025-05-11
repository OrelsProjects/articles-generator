"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
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

// Define a type for an engager
interface Engager {
  authorId: string;
  name: string;
  photoUrl: string;
  subscriberCount: number;
  subscriberCountString: string;
  score: number;
}

export default function FansPage() {
  const { data: session } = useSession();
  const router = useCustomRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { signInWithGoogle } = useAuth();

  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);
  const [animatedAvatars, setAnimatedAvatars] = useState<Set<number>>(new Set());

  const [loadingUserData, setLoadingUserData] = useState(false);
  const loadingUserDataRef = useRef(loadingUserData);

  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);

  const authorId = searchParams.get("author");
  const isAdmin = useMemo(() => session?.user?.meta?.isAdmin, [session]);

  // Handle query param author ID
  React.useEffect(() => {
    if (authorId) {
      router.removeParams(["author"]);
    }
  }, [authorId, router]);

  // Auto-fetch user data if logged in
  const fetchUserData = async () => {
    loadingUserDataRef.current = true;
    setLoadingUserData(true);
    setLoading(true);

    try {
      // Get user publication data
      const publicationRes = await axios.get("/api/user/publication");
      setAuthorImage(publicationRes.data.image);
      setAuthorName(publicationRes.data.name);

      try {
        // Get user fans data
        const fansRes = await axios.get(`/api/v1/top-engagers?authorId=${session?.user?.meta?.tempAuthorId || "null"}`);
        setEngagers(fansRes.data);
        setHasAnalyzed(true);
      } catch (error) {
        // Silently handle error, we'll show the input form
        Logger.error("Error fetching fans data:", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      // Silently handle error
      Logger.error("Error fetching user publication:", {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
      setLoadingUserData(false);
      loadingUserDataRef.current = false;
    }
  };

  // Check for logged-in user on component mount
  React.useEffect(() => {
    if (loadingUserDataRef.current) return;
    if (session?.user && engagers.length === 0) {
      fetchUserData();
    }
  }, [session, engagers.length]);

  // Calculate if input should be disabled
  const inputDisabled = useMemo(() => {
    return loading || loadingUserData || (!!session?.user && !!authorName && engagers.length > 0);
  }, [loading, loadingUserData, session?.user, authorName, engagers.length]);

  const handleBylineSelect = async (byline: Byline, forceAnalyze = false) => {
    setSelectedByline(byline);
    setLoading(true);
    setAuthorName(byline.name);
    setAuthorImage(byline.photoUrl);

    try {
      const response = await axios.get(`/api/v1/top-engagers?authorId=${byline.authorId}`);
      if (response.data.length > 0) {
        setEngagers(response.data);
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
      generateMockEngagers();
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration purposes
  const generateMockEngagers = () => {
    const mockEngagers: Engager[] = Array.from({ length: 10 }).map((_, index) => ({
      authorId: `engager-${index}`,
      name: `Engager ${index + 1}`,
      photoUrl: `https://i.pravatar.cc/150?img=${index + 10}`,
      subscriberCount: Math.floor(Math.random() * 1000),
      subscriberCountString: Math.floor(Math.random() * 1000).toString(),
      score: Math.floor(Math.random() * 100),
    }));
    setEngagers(mockEngagers);
    setHasAnalyzed(true);
  };

  const getLoginRedirect = () => {
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

  // Create the animations for avatars
  React.useEffect(() => {
    if (engagers.length > 0) {
      const interval = setInterval(() => {
        // Randomly select 1-3 avatars to animate
        const newAnimated = new Set<number>();
        const maxAnimations = Math.min(3, Math.floor(engagers.length / 3));
        const animationsCount = Math.floor(Math.random() * maxAnimations) + 1;
        
        for (let i = 0; i < animationsCount; i++) {
          newAnimated.add(Math.floor(Math.random() * engagers.length));
        }
        
        setAnimatedAvatars(newAnimated);
      }, 2000); // Run every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [engagers.length]);

  // Define shimmer animation keyframes
  React.useEffect(() => {
    // Add keyframes for shimmer effect if not already added
    if (!document.getElementById('shimmer-keyframes')) {
      const style = document.createElement('style');
      style.id = 'shimmer-keyframes';
      style.innerHTML = `
        :root {
          --color-primary-rgb: 79, 70, 229;
        }
        @keyframes shimmer {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.2);
          }
          70% {
            box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">
          Find Your Top Substack Fans
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover who engages most with your Substack content
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
          isLoading={loading}
          hasData={hasAnalyzed}
          authorName={authorName}
          authorImage={authorImage}
          isInputDisabled={inputDisabled}
          placeholder="Your Substack URL (e.g., yourname.substack.com)"
        />
      </motion.div>

      {(hasAnalyzed || loading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2 relative">
            <h2 className="text-2xl font-bold">
              Your Top Fans
            </h2>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : engagers.length > 0 ? (
              <div className="relative">
                <div className="flex flex-wrap justify-start">
                  {engagers.slice(0, Math.min(25, engagers.length)).map((engager, index) => {
                    // Calculate if this is the first item in a row (we want 5 per row)
                    const isFirstInRow = index % 5 === 0;
                    return (
                      <div 
                        key={`fan-${engager.authorId}`}
                        className={`flex-none transition-all hover:scale-110 hover:z-20 group ${isFirstInRow ? 'ml-0' : '-ml-3'}`}
                        style={{
                          zIndex: 25 - index,
                          marginBottom: '6px'
                        }}
                      >
                        <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 ${
                          animatedAvatars.has(index) 
                            ? 'border-primary shadow-lg animate-[shimmer_2s_ease-in-out]' 
                            : 'border-orange-300/50'
                          } shadow-md transition-all duration-300`}>
                          <img
                            src={engager.photoUrl}
                            alt={`${engager.name}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute opacity-0 group-hover:opacity-100 top-full mt-1 left-1/2 transform -translate-x-1/2 bg-black/85 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-30 transition-opacity">
                            {engager.name} · {engager.subscriberCountString || '0'} subs
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* "More" indicator */}
                  {engagers.length > 25 && (
                    <div className="flex items-center justify-center ml-1" style={{ marginBottom: '6px' }}>
                      <div className="bg-orange-500/10 text-orange-600 font-medium px-3 py-1 rounded-full text-sm border border-orange-300/30 hover:bg-orange-500/20 cursor-pointer transition-colors w-14 h-14 flex items-center justify-center">
                        +{engagers.length - 25}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No fans data available</p>
            )}
          </div>
        </motion.div>
      )}

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
