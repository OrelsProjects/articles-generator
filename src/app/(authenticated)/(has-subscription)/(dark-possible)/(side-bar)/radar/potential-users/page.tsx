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

export type OrderBy =
  | "recommended"
  | "name"
  | "bestsellerTier"
  | "subscriberCount";

export default function PotentialUsersPage() {
  const [potentialUsers, setPotentialUsers] = useState<BylineWithExtras[]>([]);
  const [url, setUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef<boolean>(false);
  const [orderBy, setOrderBy] = useState<OrderBy>("recommended");

  const fetchPotentialUsers = async (customUrl?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const response = await fetch("/api/v1/radar/potential-users", {
      method: "POST",
      body: JSON.stringify({
        url: customUrl || url || "https://theindiepreneur.substack.com",
      }),
    });
    const data = await response.json();
    setPotentialUsers(data);
    setUrl(customUrl || url || "https://theindiepreneur.substack.com");
    loadingRef.current = false;
    setLoading(false);
  };

  useEffect(() => {
    fetchPotentialUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      fetchPotentialUsers(inputUrl.trim());
    }
  };

  // Sort users based on orderBy
  const sortedUsers = useMemo(() => {
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
      <form onSubmit={handleAnalyze} className="flex gap-2 mb-8">
        <input
          type="text"
          className="flex-1 border border-input bg-muted text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : sortedUsers.map(user => (
              <div
                key={user.authorId}
                className="flex items-center justify-between bg-muted rounded-xl shadow p-4 w-full hover:shadow-md transition border border-border"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate flex items-center gap-1.5">
                      <Button
                        variant="link"
                        className="p-0 text-foreground text-lg"
                        asChild
                      >
                        <Link
                          href={`https://www.substack.com/@${user.handle}`}
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
                <Button variant={user.isFollowing ? "ghost" : "outline"}>
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
      </div>
    </div>
  );
}
