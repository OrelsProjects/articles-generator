"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { Logger } from "@/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error to console in development
  useEffect(() => {
    Logger.error("CRITICAL ERROR" + error.message);
    Logger.error(
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
          message: "CRITICAL ERROR",
        },
        null,
        2,
      ),
    );
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6 flex flex-col items-center">
        <Logo className="mb-10" />
        <h1 className="text-5xl font-bold text-primary">Oops</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            We&apos;ve encountered an unexpected issue.
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button variant="outline" size="lg" onClick={reset}>
            Try again
          </Button>
          <Link href="/home">
            <Button size="lg">Back to Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
