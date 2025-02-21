"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/lib/hooks/useSettings";

export function PublicationSettings() {
  const { user } = useAppSelector(selectAuth);
  const {hasPublication} = useSettings();

  if (!hasPublication) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Publication Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No publication connected. Connect your Substack to get started.
              </AlertDescription>
            </Alert>
            <AnalyzePublicationButton variant="default" className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publication Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium">Connected Publication</h3>
              <p className="text-sm text-muted-foreground">
                Your Substack is connected and ready to use.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 