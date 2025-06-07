"use client";

import React from "react";
import { useWriter } from "@/lib/hooks/useWriter";
import WriterProfile from "@/components/writer-profile";

export default function MyProfilePage() {
  const {
    writer,
    isLoading,
    fetchNextPage,
    hasMore,
    error,
    isLoadingMore,
    fetchAuthorNotes,
  } = useWriter(undefined); // undefined handle means get current user's data

  return (
    <WriterProfile
      writer={writer}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      hasMore={hasMore}
      error={error}
      isLoadingMore={isLoadingMore}
      fetchAuthorNotes={fetchAuthorNotes}
      showPopulateButton={false}
      isCurrentUser={true}
    />
  );
} 