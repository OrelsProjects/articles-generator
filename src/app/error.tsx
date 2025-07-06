"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { Logger } from "@/logger";
import { rootPath } from "@/types/navbar";
import { usePathname } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  // Log the error to console in development
  useEffect(() => {
    const pathHistory = window.history.state.back;
    Logger.error("CRITICAL ERROR" + error.message);
    Logger.error(
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
          digest: error.digest,
          pathHistory: pathHistory,
          message: "CRITICAL ERROR",
          pathname: pathname,
          route: window.location.href,
        },
        null,
        2,
      ),
      {
        data: {
          error: error.message,
          stack: error.stack,
          digest: error.digest,
          pathHistory: pathHistory,
          message: "CRITICAL ERROR",
          pathname: pathname,
          route: window.location.href,
        },
      },
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
          <Link href={rootPath}>
            <Button size="lg">Back to Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
