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
import axios from "axios";
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

const loadingStates = [
  { text: "Grabbing engagement data...", delay: 5000 },
  { text: "Analyzing publication...", delay: 4000, opacityBeforeHit: 0.1 },
  { text: "Analyzing audience...", delay: 8000, opacityBeforeHit: 0.1 },
  {
    text: "I need to look deeper. Give me a moment.",
    delay: 20000,
    opacityBeforeHit: 0.03,
  },
  { text: "Almost there...", delay: 1000, opacityBeforeHit: 0.03 },
];

export type OrderBy =
  | "recommended"
  | "name"
  | "bestsellerTier"
  | "subscriberCount";

const getUserSubstackUrl = (handle: string) => {
  return `https://www.substack.com/@${handle}`;
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
          <br />
          <br />
          <span className="text-foreground font-medium">P.S. 2</span>
          <br />
          Paging coming soon, so you&apos;ll be able to see more potential
          users.
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
  const loadingRef = useRef<boolean>(false);
  const [orderBy, setOrderBy] = useState<OrderBy>("recommended");
  const { publications } = useAppSelector(state => state.publications);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  const fetchPotentialUsers = async (customUrl?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await axios.post("/api/v1/radar/potential-users", {
        url: customUrl || url || publication?.url,
      });
      debugger;
      setPotentialUsers(response.data);
      setUrl(customUrl || url || publication?.url);
    } catch (error) {
      toast.error("Error fetching potential users");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publication) {
      fetchPotentialUsers();
    }
  }, [publication]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      fetchPotentialUsers(inputUrl.trim());
    }
  };

  // Sort users based on orderBy
  const sortedUsers = useMemo(() => {
    if (!potentialUsers || potentialUsers.length === 0) return [];
    switch (orderBy) {
      case "recommended":
        return [...potentialUsers].sort((a, b) => b.score - a.score);
      case "name":
        return [...potentialUsers].sort((a, b) => a.name.localeCompare(b.name));
      case "bestsellerTier":
        return [...potentialUsers].sort(
          (a, b) => b.bestsellerTier - a.bestsellerTier,
        );
      case "subscriberCount":
        const sorted = [...potentialUsers].sort(
          (a, b) =>
            transformSubscriberCount(b.subscriberCountString) -
            transformSubscriberCount(a.subscriberCountString),
        );
        console.log(sorted);
        return sorted;
    }
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
        <div className="h-8 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Potential Users</h1>
      <form onSubmit={handleAnalyze} className="flex items-center gap-2 mb-8">
        <Input
          type="text"
          className="py-4"
          placeholder="Enter Substack URL to analyze..."
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </form>
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[160px] justify-between">
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
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {isLoadingSkeleton
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : sortedUsers.map(user => (
              <div
                key={user.authorId}
                className="flex items-center justify-between bg-muted rounded-xl shadow p-4 w-full hover:shadow-md transition border border-border"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar>
                    <AvatarImage
                      src={user.photoUrl}
                      alt={user.name}
                      onClick={() => {
                        window.open(getUserSubstackUrl(user.handle), "_blank");
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
                        {user.subscriberCount.toLocaleString()} subscribers
                      </div>
                    ) : null}
                    <div className="text-muted-foreground text-sm line-clamp-2">
                      {user.bio}
                    </div>
                  </div>
                </div>
                {/* <Button variant={user.isFollowing ? "ghost" : "outline"}>
                  {user.isFollowing ? "Following" : "Follow"}
                </Button> */}
              </div>
            ))}
      </div>
      <ToastStepper loadingStates={loadingStates} loading={isLoadingStates} />
      <WelcomeDialog
        open={showWelcomeDialog}
        onOpenChange={setShowWelcomeDialog}
      />
    </div>
  );
}
