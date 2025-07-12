"use client";

import React from "react";
import { useWriter } from "@/lib/hooks/useWriter";
import WriterProfile from "@/components/writer-profile";

export default function WriterPage({
  params,
}: {
  params: { handle: string; name?: string };
}) {
  const {
    writer,
    isLoading,
    fetchNextPage,
    hasMore,
    error,
    isLoadingMore,
    fetchAuthorNotes,
  } = useWriter(params.handle);


  return (
    <WriterProfile
      writer={writer}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      hasMore={hasMore}
      error={error}
      isLoadingMore={isLoadingMore}
      fetchAuthorNotes={fetchAuthorNotes}
      showPopulateButton={true}
      isCurrentUser={false}
    />
  );
}
