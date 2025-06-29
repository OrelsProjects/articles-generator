"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Bug,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackStatus, FeedbackType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Input } from "@/components/ui/input";

interface UserFeedback {
  id: string;
  userId: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    handle: string | null;
  };
  _count: {
    responses: number;
  };
}

const feedbackTypeIcons: Record<FeedbackType, React.ReactNode> = {
  [FeedbackType.feedback]: <MessageCircle className="w-4 h-4" />,
  [FeedbackType.question]: <HelpCircle className="w-4 h-4" />,
  [FeedbackType.bug]: <Bug className="w-4 h-4" />,
  [FeedbackType.feature]: <Lightbulb className="w-4 h-4" />,
};

const feedbackTypeColors: Record<FeedbackType, string> = {
  [FeedbackType.feedback]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [FeedbackType.question]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [FeedbackType.bug]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  [FeedbackType.feature]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const statusColors: Record<FeedbackStatus, string> = {
  [FeedbackStatus.new]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  [FeedbackStatus.inProgress]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [FeedbackStatus.resolved]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [FeedbackStatus.closed]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const statusLabels: Record<FeedbackStatus, string> = {
  [FeedbackStatus.new]: "New",
  [FeedbackStatus.inProgress]: "In Progress",
  [FeedbackStatus.resolved]: "Resolved",
  [FeedbackStatus.closed]: "Closed",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/feedback");
      if (!response.ok) throw new Error("Failed to fetch feedback");
      const data = await response.json();
      setFeedback(data);
      setError(null);
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const updateFeedbackStatus = async (
    feedbackId: string,
    newStatus: FeedbackStatus
  ) => {
    setUpdatingStatus(feedbackId);
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedbackId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Update local state
      setFeedback(prev =>
        prev.map(f =>
          f.id === feedbackId ? { ...f, status: newStatus } : f
        )
      );
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getSubstackUrl = (handle: string) => {
    return `https://substack.com/@${handle}`;
  };

  const filteredFeedback = feedback.filter(f => {
    const matchesStatus = filterStatus === "all" || f.status === filterStatus;
    const matchesType = filterType === "all" || f.type === filterType;
    const matchesSearch = searchQuery === "" || 
      f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Feedback</h1>
          <p className="text-muted-foreground">
            Manage feedback, questions, bugs, and feature requests
          </p>
        </div>
        <Button
          onClick={fetchFeedback}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as FeedbackStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(FeedbackStatus).map(status => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as FeedbackType | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(FeedbackType).map(type => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  {feedbackTypeIcons[type]}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          {filteredFeedback.length} of {feedback.length} items
        </div>
      </div>

      {/* Feedback Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeedback.map(item => (
          <Card key={item.id} className={cn("hover:shadow-md transition-shadow", item.status === FeedbackStatus.resolved && "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 opacity-50")}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {item.subject}
                </CardTitle>
                <div className="flex gap-1">
                  <Badge className={cn("text-xs", feedbackTypeColors[item.type])}>
                    <div className="flex items-center gap-1">
                      {feedbackTypeIcons[item.type]}
                      {item.type}
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {item.user.name || "Unknown User"}
                  </span>
                  {item.user.handle && (
                    <TooltipButton
                      variant="ghost"
                      size="sm"
                      tooltipContent="View Substack Profile"
                      onClick={() =>
                        window.open(getSubstackUrl(item.user.handle!), "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </TooltipButton>
                  )}
                </div>

                {item.user.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{item.user.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(item.createdAt), "MMM d, yyyy, hh:mm a")}</span>
                </div>

                {item._count.responses > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{item._count.responses} responses</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm line-clamp-4">{item.message}</p>
              </div>

              {/* Status and Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs", statusColors[item.status])}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>

                <Select
                  value={item.status}
                  onValueChange={(value) =>
                    updateFeedbackStatus(item.id, value as FeedbackStatus)
                  }
                  disabled={updatingStatus === item.id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FeedbackStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {updatingStatus === item.id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Updating status...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeedback.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No feedback found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all" || filterType !== "all"
              ? "No feedback matches your current filters."
              : "No feedback has been submitted yet."}
          </p>
        </div>
      )}
    </div>
  );
} 