"use client";

import React from "react";
import InspirationGrid from "@/components/home/inspiration-notes-grid";
import { ImageModal } from "@/components/ui/image-modal";

export default function HomePage() {
  return (
    <div className="w-full h-full bg-background flex justify-center items-start relative z-20">
      <InspirationGrid />
      <ImageModal />
    </div>
  );
}
