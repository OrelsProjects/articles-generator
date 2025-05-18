"use client";

import React from "react";
import { Construction } from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full h-full bg-background flex justify-center items-center relative z-20">
      <div className="text-center max-w-md p-8 rounded-xl border border-primary/20 shadow-sm bg-card">
        <div className="flex justify-center mb-4">
          <Construction className="h-12 w-12 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-medium mb-3 text-foreground">
          Under Construction
        </h2>
        <p className="text-muted-foreground mb-2">
          We&apos;re building something wonderful for you!
        </p>
        <p className="text-muted-foreground text-sm">
          Please check back soon to see the magic unfold ✨
        </p>
      </div>
    </div>
  );
}
