"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Loader2,
  RefreshCw,
  Star,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Copy,
  Check,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PotentialClientStatus } from "@prisma/client";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PotentialUser {
  canonicalUrl: string;
  title: string;
  scheduledTo: string;
  publicationName: string;
  publicationId: number;
  reactionCount: number;
  status: PotentialClientStatus;
  firstMessage?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
}

// Icons for each status:
const statusIcons: Record<PotentialClientStatus, React.ReactNode> = {
  [PotentialClientStatus.new]: <Star className="w-5 h-5" />,
  [PotentialClientStatus.contacted]: <Mail className="w-5 h-5" />,
  [PotentialClientStatus.interested]: <ThumbsUp className="w-5 h-5" />,
  [PotentialClientStatus.not_interested]: <ThumbsDown className="w-5 h-5" />,
  [PotentialClientStatus.deleted]: <Trash2 className="w-5 h-5" />,
};

const statusLabels: Record<PotentialClientStatus, string> = {
  [PotentialClientStatus.new]: "New",
  [PotentialClientStatus.contacted]: "Contacted",
  [PotentialClientStatus.interested]: "Interested",
  [PotentialClientStatus.not_interested]: "Not Interested",
  [PotentialClientStatus.deleted]: "Deleted",
};

export default function AdminPage() {
  const [users, setUsers] = useState<PotentialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For local infinite scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(50); // how many rows to show initially

  // For sorting
  const [sortColumn, setSortColumn] = useState<keyof PotentialUser | null>(
    null,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  // Track which canonicalUrl is being updated to disable buttons momentarily
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const [messageGenerating, setMessageGenerating] = useState<string | null>(
    null,
  );
  const [messageDialogUser, setMessageDialogUser] =
    useState<PotentialUser | null>(null);
  const [copied, setCopied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Add ref for the first new item
  const firstNewItemRef = useRef<HTMLTableRowElement>(null);

  // Add state for custom message dialog
  const [customMessageDialogOpen, setCustomMessageDialogOpen] = useState(false);
  const [customMessageContent, setCustomMessageContent] = useState("");
  const [customMessageAuthor, setCustomMessageAuthor] = useState("");
  const [customMessageResponse, setCustomMessageResponse] = useState<
    string | null
  >(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/system/potential-users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setError(null);
      setVisibleCount(50);
      setSortColumn(null);
      setSortDirection(null);

      // Set initial load complete after first successful fetch
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add effect to scroll to first new item
  useEffect(() => {
    if (initialLoadComplete && firstNewItemRef.current && !loading) {
      firstNewItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [initialLoadComplete, loading]);

  const updateUserStatus = async (
    canonicalUrl: string,
    newStatus: PotentialClientStatus,
  ) => {
    const oldUsers = [...users];
    if (newStatus === "deleted") {
      // remove from users
      setUsers(users.filter(user => user.canonicalUrl !== canonicalUrl));
    } else {
      setUsers(prev =>
        prev.map(user =>
          user.canonicalUrl === canonicalUrl
            ? { ...user, status: newStatus }
            : user,
        ),
      );
    }

    setStatusUpdating(canonicalUrl);
    try {
      const response = await fetch("/api/admin/system/potential-users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canonicalUrl, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to update status",
      );
      setUsers(oldUsers);
    } finally {
      setStatusUpdating(null);
    }
  };

  const generateFirstMessage = async (data: {
    canonicalUrl?: string;
    custom?: {
      content: string;
      authorName: string;
    };
  }) => {
    let query = "";
    if (data.canonicalUrl) {
      query = `canonicalUrl=${encodeURIComponent(data.canonicalUrl)}`;
      setMessageGenerating(data.canonicalUrl);
    } else if (data.custom) {
      query = `content=${encodeURIComponent(data.custom.content)}&authorName=${encodeURIComponent(data.custom.authorName)}`;
      setMessageGenerating("custom");
    }
    try {
      const response = await fetch(
        `/api/admin/system/potential-users/first-message?${query}`,
      );
      if (!response.ok) throw new Error("Failed to generate message");
      const data = await response.json();

      if (data.canonicalUrl) {
        // Update the users array with the new message
        setUsers(prev =>
          prev.map(user =>
            user.canonicalUrl === data.canonicalUrl
              ? {
                  ...user,
                  firstMessage: data.message,
                  authorName: data.authorName,
                  authorUrl: data.authorUrl,
                }
              : user,
          ),
        );
      } else {
        setCustomMessageResponse(data.message);
      }
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to generate message",
      );
    } finally {
      setMessageGenerating(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Infinite scrolling logic
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

      // If user is close to bottom, load more
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setVisibleCount(prev => {
          // Load next batch (e.g. 50 more), but don't exceed total
          const next = prev + 50;
          return next >= users.length ? users.length : next;
        });
      }
    };

    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [users]);

  // Sorting logic
  const sortedUsers = useMemo(() => {
    let filteredUsers = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredUsers = users.filter(
        user =>
          user.title.toLowerCase().includes(query) ||
          user.publicationName.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    if (!sortColumn || !sortDirection) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      // Special handling for date, reactionCount, etc.
      if (sortColumn === "scheduledTo") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortColumn === "reactionCount") {
        valA = Number(valA);
        valB = Number(valB);
      }

      // For strings, compare case-insensitively
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
      }
      if (typeof valB === "string") {
        valB = valB.toLowerCase();
      }

      if (valA < valB) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortColumn, sortDirection, searchQuery]);

  // Only slice the portion we want to render
  const visibleUsers = sortedUsers.slice(0, visibleCount);

  const handleSort = (column: keyof PotentialUser) => {
    if (sortColumn === column) {
      // Toggle/cycle direction: asc -> desc -> none
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        // If you prefer to cycle to "no-sort", do so. If you prefer asc->desc->asc, remove this.
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column: keyof PotentialUser) => {
    if (sortColumn !== column) return null;
    if (sortDirection === "asc")
      return <ChevronUp className="inline-block w-4 h-4 ml-1" />;
    if (sortDirection === "desc")
      return <ChevronDown className="inline-block w-4 h-4 ml-1" />;
    return null;
  };

  return (
    <div className="container mx-auto py-10 flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Potential Users</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/free-users">
            <Button variant="outline" className="gap-2">
              Free Users
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            onClick={fetchUsers}
            variant="outline"
            disabled={loading}
            className="gap-2 text-base"
          >
            <RefreshCw className={cn("h-5 w-5", { "animate-spin": loading })} />
            Refresh
          </Button>
          <Button
            onClick={() => setCustomMessageDialogOpen(true)}
            variant="outline"
            className="gap-2 text-base"
          >
            {isGeneratingCustom ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate message</>
            )}
          </Button>
          {customMessageResponse && (
            <TooltipButton
              tooltipContent="View Generated Message"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                setMessageDialogUser({
                  firstMessage: customMessageResponse,
                  canonicalUrl: "custom",
                  title: "",
                  scheduledTo: "",
                  publicationName: "",
                  publicationId: 0,
                  reactionCount: 0,
                  status: PotentialClientStatus.new,
                })
              }
            >
              <MessageCircle className="h-5 w-5 text-primary" />
            </TooltipButton>
          )}
        </div>
      </div>

      {/* Add search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by title or publication..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 w-full max-w-sm"
        />
        {searchQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {visibleUsers.length} results
          </div>
        )}
      </div>

      {error && (
        <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md text-base">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-screen max-h-[75vh] border rounded-lg bg-card shadow-sm overflow-auto text-base"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {/* Publication */}
                <TableHead
                  onClick={() => handleSort("publicationName")}
                  className="font-semibold cursor-pointer select-none text-base"
                >
                  Publication
                  {renderSortIcon("publicationName")}
                </TableHead>

                {/* Post Title */}
                <TableHead
                  onClick={() => handleSort("title")}
                  className="font-semibold cursor-pointer select-none text-base"
                >
                  Post Title
                  {renderSortIcon("title")}
                </TableHead>

                {/* Post Date */}
                <TableHead
                  onClick={() => handleSort("scheduledTo")}
                  className="font-semibold cursor-pointer select-none text-base"
                >
                  Post Date
                  {renderSortIcon("scheduledTo")}
                </TableHead>

                {/* Reactions */}
                <TableHead
                  onClick={() => handleSort("reactionCount")}
                  className="font-semibold cursor-pointer select-none text-right text-base"
                >
                  Reactions
                  {renderSortIcon("reactionCount")}
                </TableHead>

                {/* Status */}
                <TableHead
                  onClick={() => handleSort("status")}
                  className="font-semibold cursor-pointer select-none text-base"
                >
                  Status
                  {renderSortIcon("status")}
                </TableHead>

                {/* Message */}
                <TableHead className="font-semibold text-base">
                  Message
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((user, i) => (
                <TableRow
                  key={user.canonicalUrl}
                  // Add ref to first new item
                  ref={
                    user.status === PotentialClientStatus.new &&
                    !firstNewItemRef.current
                      ? firstNewItemRef
                      : null
                  }
                  className={cn(
                    "hover:bg-muted/50 transition-colors text-base",
                    i % 2 === 0 ? "bg-background" : "bg-card",
                  )}
                >
                  {/* Publication */}
                  <TableCell className="font-medium">
                    <a
                      href={user.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-base"
                    >
                      {user.publicationName}
                    </a>
                  </TableCell>

                  {/* Post Title */}
                  <TableCell className="max-w-md truncate text-base">
                    {user.title}
                  </TableCell>

                  {/* Post Date */}
                  <TableCell>
                    {format(new Date(user.scheduledTo), "MMM d, yyyy")}
                  </TableCell>

                  {/* Reaction Count */}
                  <TableCell className="text-right font-medium text-base">
                    {user.reactionCount}
                  </TableCell>

                  {/* Status (icon-based buttons) */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {Object.values(PotentialClientStatus).map(st => {
                        const isActive = user.status === st;
                        return (
                          <TooltipButton
                            tooltipContent={statusLabels[st]}
                            key={st}
                            variant={isActive ? "default" : "ghost"}
                            size="icon"
                            disabled={statusUpdating === user.canonicalUrl}
                            onClick={() =>
                              updateUserStatus(user.canonicalUrl, st)
                            }
                            title={statusLabels[st]}
                            className="h-9 w-9"
                          >
                            {statusIcons[st]}
                          </TooltipButton>
                        );
                      })}
                    </div>
                  </TableCell>

                  {/* Add after the Status buttons */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {messageGenerating === user.canonicalUrl ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : user.firstMessage ? (
                        <TooltipButton
                          tooltipContent="View Message"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setMessageDialogUser(user)}
                        >
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </TooltipButton>
                      ) : (
                        <TooltipButton
                          tooltipContent="Generate First Message"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() =>
                            generateFirstMessage({
                              canonicalUrl: user.canonicalUrl,
                            })
                          }
                        >
                          <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        </TooltipButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add the Dialog component at the end of the component */}
      <Dialog
        open={!!messageDialogUser}
        onOpenChange={() => setMessageDialogUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle aria-label="First Message">First Message</DialogTitle>
            {messageDialogUser?.authorName && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>For:</span>
                {messageDialogUser.authorUrl ? (
                  <a
                    href={messageDialogUser.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {messageDialogUser.authorName}
                  </a>
                ) : (
                  <span>{messageDialogUser.authorName}</span>
                )}
              </div>
            )}
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="relative p-4 bg-muted rounded-lg">
              <p className="pr-10 text-base">
                {messageDialogUser?.firstMessage}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
                onClick={() =>
                  handleCopy(messageDialogUser?.firstMessage || "")
                }
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                generateFirstMessage({
                  canonicalUrl: messageDialogUser?.canonicalUrl,
                });
                setMessageDialogUser(null);
              }}
            >
              Regenerate Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the custom message dialog */}
      <Dialog
        open={customMessageDialogOpen}
        onOpenChange={setCustomMessageDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle aria-label="Generate Custom Message">
              Generate Custom Message
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="author">Author Name (optional)</Label>
              <Input
                id="author"
                value={customMessageAuthor}
                onChange={e => setCustomMessageAuthor(e.target.value)}
                placeholder="Enter author name..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Article Content</Label>
              <Textarea
                id="content"
                value={customMessageContent}
                onChange={e => setCustomMessageContent(e.target.value)}
                placeholder="Enter article content..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!customMessageContent) return;
                setIsGeneratingCustom(true);
                try {
                  const response = await generateFirstMessage({
                    custom: {
                      content: customMessageContent,
                      authorName: customMessageAuthor,
                    },
                  });
                  setCustomMessageDialogOpen(false);
                  setCustomMessageContent("");
                  setCustomMessageAuthor("");
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsGeneratingCustom(false);
                }
              }}
              disabled={!customMessageContent || isGeneratingCustom}
            >
              {isGeneratingCustom ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
