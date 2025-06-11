"use client";

import React from "react";
import UserWriterProfile from "@/components/user-writer-profile";
import { useMePage } from "@/lib/hooks/useMePage";

export default function MyProfilePage() {
  const {
    isLoading,
    fetchNextPage,
    hasMore,
    error,
    isLoadingMore,
    isLoadingOrderBy,
    isLoadingOrderDirection,
    data,
    updateOrderBy,
    updateOrderDirection,
    orderBy,
    orderDirection,
  } = useMePage();

  return (
    <UserWriterProfile
      writer={data}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      hasMore={hasMore}
      error={error}
      isLoadingMore={isLoadingMore}
      isLoadingOrderBy={isLoadingOrderBy}
      isLoadingOrderDirection={isLoadingOrderDirection}
      updateOrderBy={updateOrderBy}
      updateOrderDirection={updateOrderDirection}
      orderBy={orderBy}
      orderDirection={orderDirection}
    />
  );
}


// FIX PLAGIARISM BUG WHERE AUTHOR ID IS NULL AND READY TO SHIP.