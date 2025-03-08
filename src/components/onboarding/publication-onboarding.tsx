"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { useSettings } from "@/lib/hooks/useSettings";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks/redux";
import Logo from "@/components/ui/logo";
import Image from "next/image";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteRoom";

export function PublicationOnboarding() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasPublication } = useSettings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Short delay to ensure settings are loaded
    const timer = setTimeout(() => {
      setLoading(false);

      // If user already has a publication, redirect to home
      if (hasPublication) {
        router.push("/home");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasPublication, router, dispatch]);

  // Prevent navigation if user doesn't have a publication
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasPublication) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPublication]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPublication) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
      <Image
        src="/home-dark.png"
        alt="Home"
        fill
        className="absolute inset-0 hidden dark:block z-10"
      />
      <Image
        src="/home-light.png"
        alt="Home"
        fill
        className="absolute inset-0 block dark:hidden z-10"
      />
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm  p-4 z-20" />
      <Card className="w-full max-w-md z-50">
        <CardHeader>
          {/* <div className="w-full flex items-center justify-center"> */}
          <Logo className="w-10 h-10" />
          {/* </div> */}
          <CardTitle className="text-2xl">Welcome to {appName}</CardTitle>
          <CardDescription>
            Before you can start, we need to connect your publication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {appName} works by analyzing your existing content to help you
            create better notes and ideas. Please connect your publication to
            continue.
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium">What you&apos;ll need:</p>
            <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Your publication URL (e.g., yourname.substack.com)</li>
              <li>
                Public access to your publication (Paid publications is also
                okay)
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <AnalyzePublicationButton variant="default" className="w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}
