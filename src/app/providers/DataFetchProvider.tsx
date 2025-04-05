"use client";

import { useNotes } from "@/lib/hooks/useNotes";
import { useEffect } from "react";

export function DataFetchProvider({ children }: { children: React.ReactNode }) {
  const { userNotes, fetchNotes, updateByline } = useNotes();

  useEffect(() => {
    if (userNotes.length === 0) {
      fetchNotes();
    }
  }, []);

  useEffect(() => {
    updateByline();
  }, []);
  return <>{children}</>;
}
