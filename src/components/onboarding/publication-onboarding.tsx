"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import Logo from "@/components/ui/logo";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {  RefreshCcw } from "lucide-react";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteStack";

export function PublicationOnboarding({
  onAnalyzed,
  onAlreadyAnalyzed,
  loadingAnalyzed = false,
}: {
  onAnalyzed?: () => void;
  onAlreadyAnalyzed?: () => void;
  loadingAnalyzed?: boolean;
}) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
      <Image
        src="/home-dark.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill hidden dark:block z-10"
      />
      <Image
        src="/home-light.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill block dark:hidden z-10"
      />
      <div className="absolute inset-0 bg-foreground/70 dark:bg-background/50 backdrop-blur-sm z-20" />
      <Card className="w-full max-w-md z-30">
        <CardHeader>
          <Logo className="w-10 h-10" />
          <CardTitle className="text-2xl">Welcome to {appName}</CardTitle>
          <CardDescription>
            In order to get started, you need to connect your publication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {appName} works by analyzing your existing content to help you
            create better notes and ideas.
          </p>
          <p className="text-sm text-muted-foreground font-semibold">
            Make sure to connect the publication you&apos;re logged into to be able to use all the features.
          </p>
        </CardContent>
        <CardFooter className="w-full">
          <div className="w-full flex flex-col gap-2 items-center justify-center">
            <AnalyzePublicationButton
              variant="default"
              className="w-full"
              onAnalyzed={onAnalyzed}
            />
            <Button
              variant="ghost"
              className="w-full"
              onClick={onAlreadyAnalyzed}
              disabled={loadingAnalyzed}
            >
              {loadingAnalyzed ? (
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <></>
              )}
              I have already analyzed my publication
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
