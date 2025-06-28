"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BestSeller100,
  BestSeller1000,
  BestSeller10000,
} from "@/components/ui/best-seller-badge";
import { BylineWithExtras } from "@/types/article";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { transformSubscriberCount } from "@/lib/utils/subscriber-count";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/hooks/redux";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToastStepper } from "@/components/ui/toast-stepper";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { ScrollArea } from "@/components/ui/scroll-area";
import axiosInstance from "@/lib/axios-instance";
import { motion } from "framer-motion";
import { validatePublication } from "@/lib/utils/url";

const loadingStates = [
  { text: "Grabbing engagement data...", delay: 5000 },
  { text: "Analyzing publication...", delay: 4000, opacityBeforeHit: 0.1 },
  { text: "Analyzing audience...", delay: 8000, opacityBeforeHit: 0.1 },
  {
    text: "I need to look deeper. Give me a moment.",
    delay: 40000,
    opacityBeforeHit: 0.03,
  },
  { text: "Almost there...", delay: 99999, opacityBeforeHit: 0.03 },
];

export type OrderBy =
  | "recommended"
  | "name"
  | "bestsellerTier"
  | "subscriberCount";

const getUserSubstackUrl = (handle: string) => {
  return `https://www.substack.com/@${handle}`;
};

// URL validation function
const isValidSubstackUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  // Allow various formats: substack.com, .substack.com, https://...
  const substackRegex = /^(https?:\/\/)?([\w-]+\.)?substack\.com\/?.*$/i;
  return substackRegex.test(trimmedUrl);
};

const WelcomeDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeOnOutsideClick={false}>
        <DialogHeader>
          <DialogTitle>Welcome to the Potential Users Radar</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          This is a tool that helps you find potential customers.
          <br />
          <br />
          You can either use it to get potential users based on different
          publications.
          <br />
          <br />
          <span className="underline">example:</span>
          <br />I am looking for people who are interested in solopreneurship. I
          know Orel writes about it, therefore I&apos;ll analyze his
          publication:
          <br />
          <Link
            href="theindiepreneur.substack.com"
            className="text-foreground/80"
            target="_blank"
          >
            theindiepreneur.substack.com
          </Link>
          <br />
          (Shameless self-promotion)
          <br />
          <br />
          <span className="text-foreground font-medium">P.S.</span>
          <br />
          Some of the data is not saved in the database, so analyzing can take
          up to 2 minutes.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Awesome!</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function PotentialUsersPage() {
  const [showWelcomeDialog, setShowWelcomeDialog] = useLocalStorage(
    "show_welcome_users_radar",
    true,
  );
  const [potentialUsers, setPotentialUsers] = useState<BylineWithExtras[]>([]);
  const [url, setUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadingRef = useRef<boolean>(false);
  const scrollThrottleRef = useRef<boolean>(false);
  const [orderBy, setOrderBy] = useState<OrderBy>("recommended");
  const { publications } = useAppSelector(state => state.publications);

  const containerRef = useRef<HTMLDivElement>(null);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  const fetchPotentialUsers = async (
    customUrl?: string,
    pageNum: number = 0,
  ) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        "/api/v1/radar/potential-users",
        {
          url: customUrl || url || publication?.url,
          page: pageNum,
          take: 30,
        },
      );

      if (pageNum === 0) {
        setPotentialUsers(response.data);
      } else {
        setPotentialUsers(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length > 0);
      setUrl(customUrl || url || publication?.url);
    } catch (error) {
      toast.error("Error fetching potential users");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // Remove automatic fetch on mount
  // useEffect(() => {
  //   if (publication) {
  //     fetchPotentialUsers(undefined, 0);
  //   }
  // }, [publication]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { valid } = await validatePublication(inputUrl.trim());

      if (!valid) {
        toast.error("The url is not a valid Substack publication url");
        return;
      }

      setPage(0);
      setHasMore(true);
      fetchPotentialUsers(inputUrl.trim(), 0);
    } catch (error) {
      toast.error("Error analyzing publication");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Setup scroll listener for pagination
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      // when you've scrolled 70% down the container
      if (scrollTop + clientHeight >= scrollHeight * 0.7) {
        if (scrollThrottleRef.current) return;
        scrollThrottleRef.current = true;

        const nextPage = page + 1;
        setPage(nextPage);
        fetchPotentialUsers(url, nextPage);

        setTimeout(() => {
          scrollThrottleRef.current = false;
        }, 1000);
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, page, url, containerRef.current]);

  // Sort users based on orderBy
  const sortedUsers = useMemo(() => {
    if (!potentialUsers || potentialUsers.length === 0) return [];
    let sorted = [...potentialUsers];
    switch (orderBy) {
      case "recommended":
        sorted = [...potentialUsers].sort((a, b) => b.score - a.score);
        break;
      case "name":
        sorted = [...potentialUsers].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        break;
      case "bestsellerTier":
        sorted = [...potentialUsers].sort(
          (a, b) => b.bestsellerTier - a.bestsellerTier,
        );
        break;
      case "subscriberCount":
        sorted = [...potentialUsers].sort(
          (a, b) =>
            transformSubscriberCount(b.subscriberCountString) -
            transformSubscriberCount(a.subscriberCountString),
        );
    }
    const uniqueSorted = sorted.filter(
      (user, index, self) =>
        index === self.findIndex(t => t.authorId === user.authorId),
    );
    console.log(uniqueSorted);
    return uniqueSorted;
  }, [potentialUsers, orderBy]);

  // if string contains a number, return true
  const shouldShowSubscriberCountString = (user: BylineWithExtras) => {
    return (
      user.subscriberCountString != null &&
      user.subscriberCountString.length > 0 &&
      /\d/.test(user.subscriberCountString)
    );
  };

  const shouldShowSubscriberCount = (user: BylineWithExtras) => {
    return user.subscriberCount != null && user.subscriberCount > 0;
  };

  const orderByText = useMemo(() => {
    switch (orderBy) {
      case "recommended":
        return "Recommended";
      case "name":
        return "Name";
      case "bestsellerTier":
        return "Bestseller Tier";
      case "subscriberCount":
        return "Subscriber Count";
    }
  }, [orderBy]);

  const isLoadingSkeleton = useMemo(
    () => loading && sortedUsers.length === 0,
    [loading, sortedUsers],
  );
  const isLoadingStates = useMemo(
    () => loading && sortedUsers.length > 0,
    [loading, sortedUsers],
  );

  // Check if we should show the centered layout
  // Show centered layout only when there's no data AND no ongoing search
  const showCenteredLayout = sortedUsers.length === 0 && !loading;

  function SkeletonCard() {
    return (
      <div className="flex items-center justify-between bg-card rounded-xl shadow p-4 w-full border border-border">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="min-w-0 flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-full flex-1 overflow-y-auto" ref={containerRef}>
        <div className="feature-layout-container py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${showCenteredLayout ? "h-full flex flex-col" : ""}`}
          >
            {/* Header Section */}
            <div
              className={`space-y-4 ${showCenteredLayout ? "flex-shrink-0" : "mb-8"}`}
            >
              <h1
                className={`font-bold ${showCenteredLayout ? "text-4xl" : "text-3xl"}`}
              >
                Potential Users
              </h1>
              <p
                className={`text-muted-foreground ${showCenteredLayout ? "text-lg" : "hidden"}`}
              >
                Find potential customers by analyzing Substack publications
              </p>
            </div>

            {/* Form Container - Animated positioning */}
            <motion.div
              className={`${showCenteredLayout ? "h-full flex-1 flex flex-col items-center justify-center" : ""}`}
              layout
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <motion.form
                onSubmit={handleAnalyze}
                className={`flex items-center gap-2 ${showCenteredLayout ? "w-full max-w-xl mx-auto" : "mb-8"}`}
                layout
                transition={{ duration: 0.5 }}
              >
                <Input
                  type="text"
                  className={`${showCenteredLayout ? "py-4 text-lg" : "py-4"}`}
                  placeholder="Enter Substack newsletter URL"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                />
                <Button
                  type="submit"
                  disabled={(loading && page === 0) || isAnalyzing}
                  size={showCenteredLayout ? "lg" : "default"}
                >
                  {(loading && page === 0) || isAnalyzing
                    ? "Analyzing..."
                    : "Analyze"}
                </Button>
              </motion.form>

              {/* Example text - only show when centered */}
              <motion.div
                className="text-sm text-muted-foreground space-y-2 text-center mt-4"
                initial={false}
                animate={{
                  opacity: showCenteredLayout ? 1 : 0,
                  height: showCenteredLayout ? "auto" : 0,
                }}
                transition={{ duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                <p className="text-muted-foreground">
                  Use the Radar to find top engagers of other newsletters.
                </p>
                <p>(Analysis may take up to 2 minutes for detailed insights)</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Results Section - only show when there's data or loading */}
          {(loading || sortedUsers.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[160px] justify-between"
                    >
                      Order by: {orderByText}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={orderBy}
                      onValueChange={v => {
                        console.log(v);
                        setOrderBy(v as OrderBy);
                      }}
                    >
                      <DropdownMenuRadioItem value="recommended">
                        Recommended
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="subscriberCount">
                        Subscriber Count
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="bestsellerTier">
                        Bestseller Tier
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">
                        Name
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {isLoadingSkeleton
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))
                  : sortedUsers.map((user, index) => (
                      <motion.div
                        key={`${user.authorId}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between bg-card rounded-xl shadow p-4 w-full hover:shadow-md transition border border-border"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar>
                            <AvatarImage
                              src={user.photoUrl}
                              alt={user.name}
                              onClick={() => {
                                window.open(
                                  getUserSubstackUrl(user.handle),
                                  "_blank",
                                );
                              }}
                              className="w-12 h-12 rounded-full object-cover border border-border flex-shrink-0 cursor-pointer"
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              <User className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-lg truncate flex items-center gap-1.5">
                              <Button
                                variant="link"
                                className="p-0 text-foreground text-lg"
                                asChild
                              >
                                <Link
                                  href={getUserSubstackUrl(user.handle)}
                                  target="_blank"
                                >
                                  {user.name}
                                </Link>
                              </Button>
                              {user.bestsellerTier >= 10000 ? (
                                <BestSeller10000 height={16} width={16} />
                              ) : user.bestsellerTier >= 1000 ? (
                                <BestSeller1000 height={16} width={16} />
                              ) : user.bestsellerTier >= 100 ? (
                                <BestSeller100 height={16} width={16} />
                              ) : null}
                            </div>
                            {shouldShowSubscriberCountString(user) ? (
                              <div className="text-xs text-muted-foreground">
                                {user.subscriberCountString}
                              </div>
                            ) : shouldShowSubscriberCount(user) ? (
                              <div className="text-muted-foreground text-xs line-clamp-2">
                                {user.subscriberCount.toLocaleString()}{" "}
                                subscribers
                              </div>
                            ) : null}
                            <div className="text-muted-foreground text-sm line-clamp-2">
                              {user.bio}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                {loading && page > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={`loading-${i}`} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <ToastStepper
            loadingStates={loadingStates}
            loading={isLoadingStates}
          />
          <WelcomeDialog
            open={showWelcomeDialog}
            onOpenChange={setShowWelcomeDialog}
          />
        </div>
      </div>
    </div>
  );
}
