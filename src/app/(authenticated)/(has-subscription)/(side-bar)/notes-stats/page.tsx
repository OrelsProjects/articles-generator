"use client";

import React from "react";
import UserWriterProfile from "@/components/user-writer-profile";
import { useMePage } from "@/lib/hooks/useMePage";
import ExtensionNeededWrapper from "@/components/extension-needed-wrapper";

export default function MyProfilePage() {
  const {
    isLoading,
    fetchNextPage,
    hasMore,
    error,
    isLoadingMore,
    isLoadingOrderBy,
    isLoadingOrderDirection,
    isLoadingDateRange,
    data,
    updateOrderBy,
    updateOrderDirection,
    updateDateRange,
    orderBy,
    orderDirection,
    dateRange,
    customDateRange,
  } = useMePage();

  return (
    <ExtensionNeededWrapper
      loading={isLoading}
      body="In order to see all your notes with their engagement statistics, you'll need to install our Chrome extension."
      className="w-1/2"
      wrapper={({ children }) => (
        <div className="w-full h-full flex justify-center items-center">
          {children}
        </div>
      )}
    >
      <UserWriterProfile
        writer={data}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        hasMore={hasMore}
        error={error}
        isLoadingMore={isLoadingMore}
        isLoadingOrderBy={isLoadingOrderBy}
        isLoadingOrderDirection={isLoadingOrderDirection}
        isLoadingDateRange={isLoadingDateRange}
        updateOrderBy={updateOrderBy}
        updateOrderDirection={updateOrderDirection}
        updateDateRange={updateDateRange}
        orderBy={orderBy}
        orderDirection={orderDirection}
        dateRange={dateRange}
        customDateRange={customDateRange}
      />
    </ExtensionNeededWrapper>
  );
}
