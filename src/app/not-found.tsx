"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { Logger } from "@/logger";
import { rootPath } from "@/types/navbar";
import { useAppSelector } from "@/lib/hooks/redux";

const NotFound = () => {
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    Logger.info("User hit 404 - session", { user });
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6 flex flex-col items-center">
        <Logo className="mb-10" />
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <Link href={rootPath}>
          <Button size="lg" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
