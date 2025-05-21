"use client";

import { useState, useEffect } from "react";
import { usePublicationSettings } from "@/lib/hooks/usePublicationSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, InfoIcon, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import RefreshPublicationData from "@/components/settings/refresh-publication-data";

export function PublicationPreferences() {
  const { publicationSettings, loading, updateSettings, hasPublication } =
    usePublicationSettings();
  const [personalDescription, setPersonalDescription] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (publicationSettings) {
      setPersonalDescription(publicationSettings.personalDescription || "");
      setPreferredTopics(publicationSettings.preferredTopics || []);
    }
  }, [publicationSettings]);

  const handleAddTopic = (type: "preferred" | "main") => {
    if (!newTopic.trim()) return;

    if (type === "preferred") {
      if (!preferredTopics.includes(newTopic)) {
        setPreferredTopics([...preferredTopics, newTopic]);
      }
    }

    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string, type: "preferred" | "main") => {
    if (type === "preferred") {
      setPreferredTopics(preferredTopics.filter(t => t !== topic));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        personalDescription,
        preferredTopics,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPublication) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publication Preferences</CardTitle>
          <CardDescription>
            Customize your publication preferences to improve content
            generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              You need to connect a publication before you can set preferences.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading && !publicationSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publication Preferences</CardTitle>
          <CardDescription>
            Customize your publication preferences to improve content
            generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col">
          <CardTitle>Publication Preferences</CardTitle>
          <CardDescription>
            Customize your publication preferences to improve content
            generation.
          </CardDescription>
        </div>
        <RefreshPublicationData />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="personalDescription">Personal Prompt</Label>
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    We&apos;ve generated a description based on your
                    publication, but you can provide your own to improve content
                    generation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="personalDescription"
            placeholder="Describe anything you want to add to the prompt. This description will take precedence over the generated description."
            value={personalDescription}
            onChange={e => setPersonalDescription(e.target.value)}
            rows={4}
          />
          {publicationSettings?.generatedDescription && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Generated description:</span>{" "}
                {publicationSettings.generatedDescription}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="preferredTopics">Preferred Topics</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Topics you&apos;re interested in writing about. These will
                    be used to generate content ideas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Input
              id="preferredTopics"
              placeholder="Add a topic..."
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTopic("preferred")}
            />
            <Button
              type="button"
              onClick={() => handleAddTopic("preferred")}
              disabled={!newTopic.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferredTopics.map(topic => (
              <Badge
                key={topic}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic, "preferred")}
                  className="ml-1 rounded-full hover:bg-destructive/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {publicationSettings?.generatedTopics && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Generated topics:</span>{" "}
                {publicationSettings.generatedTopics}
              </p>
            </div>
          )}
        </div>

        <Alert className="bg-muted">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            We&apos;ve generated some data about your publication to help with
            content creation. Your custom preferences will be prioritized over
            the generated data.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
