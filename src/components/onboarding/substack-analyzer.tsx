"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBylines } from "@/lib/publication";
import { Byline } from "@/types/article";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { AuthorSelectionDialog } from "@/components/onboarding/author-selection-dialog";
export function SubstackAnalyzer() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bylines, setBylines] = useState<Byline[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Byline | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a Substack URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/publication/bylines?url=${url}`);
      const data = await response.json();
      setBylines(data);

      if (data.length === 0) {
        toast.error("No authors found");
      } else {
        setDialogOpen(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to analyze Substack URL",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAuthorSelect = (byline: Byline) => {
    setSelectedAuthor(byline);
    setDialogOpen(false);
    toast.success(`You selected ${byline.name} (@${byline.handle})`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Analyze Substack Publication</h2>
        <p className="text-muted-foreground">
          Enter your Substack publication URL to find and select your author
          profile.
        </p>
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder="Enter Substack URL (e.g., https://example.substack.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {selectedAuthor && (
        <div className="p-4 rounded-lg border bg-accent/50">
          <h3 className="font-medium mb-2">Selected Author:</h3>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={selectedAuthor.photoUrl}
                alt={selectedAuthor.name}
              />
              <AvatarFallback>
                {selectedAuthor.name
                  .split(" ")
                  .map(n => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{selectedAuthor.name}</p>
              <p className="text-sm text-muted-foreground">
                @{selectedAuthor.handle}
              </p>
            </div>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() => setDialogOpen(true)}
            >
              Change
            </Button>
          </div>
        </div>
      )}

      <AuthorSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bylines={bylines}
        onSelect={handleAuthorSelect}
      />
    </div>
  );
}
