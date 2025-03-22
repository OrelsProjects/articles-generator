"use client";

import { useState } from "react";
import { useSubstackPost } from "./useSubstackPost";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SubstackPostExample() {
  const { createPost, isLoading, error } = useSubstackPost();
  const [loading, setLoading] = useState(false);
  const [loadingPing, setLoadingPing] = useState(false);
  const [message, setMessage] = useState("This is a test from writeroom");
  const [scheduleHours, setScheduleHours] = useState("");
  const [autoClose, setAutoClose] = useState(false);

  const handlePost = async () => {
    try {
      await createPost({
        message,
        scheduleSeconds: scheduleHours
          ? Number(scheduleHours) * 3600
          : undefined,
        autoCloseTab: autoClose,
      });
      // Clear form on success
      setMessage("");
      setScheduleHours("");
      setAutoClose(false);
    } catch (error) {
      // Error is already handled by the hook
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Substack Post</h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Post Content</Label>
          <Textarea
            id="message"
            placeholder="Write your post content here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule (hours from now)</Label>
          <Input
            id="schedule"
            type="number"
            min="0"
            placeholder="Leave empty for immediate post"
            value={scheduleHours}
            onChange={e => setScheduleHours(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto-close"
            checked={autoClose}
            onCheckedChange={setAutoClose}
          />
          <Label htmlFor="auto-close">Auto-close tab after posting</Label>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <Button
          onClick={handlePost}
          disabled={isLoading || !message.trim()}
          className="w-full"
        >
          {isLoading ? "Posting..." : "Post to Substack"}
        </Button>
      </div>
    </div>
  );
}
