"use client";

import React, { useEffect } from "react";
import InspirationGrid from "@/components/home/inspiration-notes-grid";
import { EventTracker } from "@/eventTracker";

export default function HomePage() {
  // Track how long on this page
  useEffect(() => {
    const date = new Date();

    return () => {
      const endDate = new Date();
      const duration = endDate.getTime() - date.getTime();
      EventTracker.track("page_view", {
        page: "home",
        duration: `${duration / 1000}s`,
      });
    };
  }, []);

  return (
    <div className="w-full h-full bg-background flex justify-center items-start relative z-20">
      <InspirationGrid />
    </div>
  );
}
