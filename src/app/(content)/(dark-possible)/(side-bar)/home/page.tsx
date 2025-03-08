"use client";

import React, { useEffect } from "react";
import InspirationGrid from "@/components/home/inspiration-notes-grid";
import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";
import { ImageModal } from "@/components/ui/image-modal";
import { useNotes } from "@/lib/hooks/useNotes";

export default function HomePage() {
  const { fetchNotes, fetchInspirationNotes } = useNotes();

  useEffect(() => {
    fetchNotes();
    fetchInspirationNotes();
  }, []);

  return (
    <div className="w-full h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto flex-1 relative">
        <InspirationGrid />
        <ImageModal />
      </div>
    </div>
  );
}
