"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useSettings } from "@/lib/hooks/useSettings";
import { Logger } from "@/logger";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AccountSection() {
  const { user } = useAppSelector(selectAuth);
  const { updatePreferredLanguage, updateName } = useSettings();
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.meta?.preferredLanguage || "en",
  );
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [nameChanged, setNameChanged] = useState(false);

  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value);
    setSavingLanguage(true);
    try {
      const success = await updatePreferredLanguage(value);
      if (success) {
        toast.success("Language preference updated successfully");
      } else {
        toast.error("Failed to update language preference");
      }
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleNameChange = (value: string) => {
    setDisplayName(value);
    setNameChanged(value !== (user?.displayName || ""));
  };

  const handleSaveName = async () => {
    if (!nameChanged || !displayName.trim()) return;

    setSavingName(true);
    try {
      await updateName(displayName.trim());
      toast.success("Name updated successfully");
      setNameChanged(false);
    } catch (error) {
      Logger.error("Error updating name:", { error });
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={e => handleNameChange(e.target.value)}
              disabled={savingName}
            />
            {nameChanged && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingName || !displayName.trim()}
                  className="flex items-center gap-2"
                >
                  {savingName ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Name"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDisplayName(user?.displayName || "");
                    setNameChanged(false);
                  }}
                  disabled={savingName}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={user?.email || ""} disabled />
            <p className="text-sm text-muted-foreground">
              Your email address is used for login and cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
              disabled={savingLanguage}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  English{" "}
                  <span className="text-muted-foreground">(American)</span>
                </SelectItem>
                <SelectItem value="en-GB">
                  English{" "}
                  <span className="text-muted-foreground">(British)</span>
                </SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
              </SelectContent>
            </Select>
            {savingLanguage && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving language preference...
              </p>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Note: The language preference affects the AI-generated content
                only, not the application interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
