"use client";

import React, { useEffect } from "react";
import InspirationGrid from "@/components/home/inspiration-notes-grid";
import Sidebar from "@/components/home/sidebar";
import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";
import { ImageModal } from "@/components/ui/image-modal";
import PersonalNotesGrid from "@/components/home/personal-notes-grid";
import { useNotes } from "@/lib/hooks/useNotes";

export default function HomePage() {
  const { fetchNotes, fetchInspirationNotes } = useNotes();

  useEffect(() => {
    fetchNotes();
    fetchInspirationNotes();
  }, []);

  return (
    <div className="flex h-screen bg-muted/80 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="w-screen h-screen overflow-auto">
        <div className="max-w-7xl mx-auto flex-1 relative">
          <PersonalNotesGrid />
          <InspirationGrid />
          <ImageModal />
        </div>
      </div>
    </div>
  );
}
