import { UserWriterWithData } from "@/types/writer";
import { useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios-instance";
import { useState } from "react";
import { Logger } from "@/logger";
import {
  OrderByNotesEngagement,
  OrderByNotesEngagementEnum,
} from "@/types/notes-stats";
import { AxiosError } from "axios";
import { DateRangeOption, DATE_RANGE_OPTIONS } from "@/lib/consts";
import { DateRange } from "react-day-picker";

export const useMePage = () => {
  const [data, setData] = useState<UserWriterWithData | null>(null);
  const [orderBy, setOrderBy] = useState<OrderByNotesEngagement>(
    OrderByNotesEngagementEnum.totalFreeSubscriptions,
  );
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<DateRangeOption>(DATE_RANGE_OPTIONS.ALL_TIME);
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingOrderBy, setIsLoadingOrderBy] = useState(false);
  const [isLoadingOrderDirection, setIsLoadingOrderDirection] = useState(false);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);

  const fetchData = async (options?: {
    page?: number;
    orderBy?: OrderByNotesEngagement;
    orderDirection?: "asc" | "desc";
    dateRange?: DateRangeOption;
    customDateRange?: DateRange | null;
    shouldLoad?: boolean;
  }) => {
    if (!hasMore) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (options?.page !== 1) {
      setIsLoadingMore(true);
    } else if (options?.shouldLoad) {
      setIsLoading(true);
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("orderBy", options?.orderBy || orderBy);
      queryParams.set(
        "orderDirection",
        options?.orderDirection || orderDirection,
      );
      queryParams.set("dateRange", options?.dateRange || dateRange);
      
      // Add custom date range if applicable
      const currentCustomRange = options?.customDateRange || customDateRange;
      if ((options?.dateRange || dateRange) === DATE_RANGE_OPTIONS.CUSTOM && 
          currentCustomRange?.from) {
        queryParams.set("startDate", currentCustomRange.from.toISOString());
        if (currentCustomRange.to) {
          queryParams.set("endDate", currentCustomRange.to.toISOString());
        }
      }

      queryParams.set("limit", "30");
      queryParams.set("page", options?.page?.toString() || "1");

      const response = await axiosInstance.get<{
        response: UserWriterWithData;
        hasMore: boolean;
      }>(`/api/writer/me?${queryParams.toString()}`);

      if (options?.page === 1 || !data) {
        setData(response.data.response);
      } else {
        const currentWriter = data;
        const newTopNotes = [
          ...currentWriter.topNotes,
          ...response.data.response.topNotes,
        ];
        setData({
          ...currentWriter,
          topNotes: newTopNotes,
        });
      }

      setHasMore(response.data.hasMore);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 403) {
          setError(
            new Error(
              "Make sure you are connected to the same account on WriteStack and on Substack",
            ),
          );
          return;
        }
      }
      Logger.error(String(err));
      setError(err as Error);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
      setIsLoading(false);
    }
  };

  const fetchNextPage = () => {
    fetchData({
      page: page + 1,
    }).then(() => {
      setPage(page + 1);
    });
  };

  const updateOrderBy = async (orderBy: OrderByNotesEngagement) => {
    setIsLoadingOrderBy(true);
    setOrderBy(orderBy);
    setPage(1);
    setHasMore(true);
    await fetchData({
      orderBy,
      orderDirection,
      dateRange,
      customDateRange,
      page: 1,
    });
    setIsLoadingOrderBy(false);
  };

  const updateOrderDirection = async (orderDirection: "asc" | "desc") => {
    setIsLoadingOrderDirection(true);
    setOrderDirection(orderDirection);
    setPage(1);
    setHasMore(true);
    await fetchData({
      orderDirection,
      orderBy,
      dateRange,
      customDateRange,
      page: 1,
    });
    setIsLoadingOrderDirection(false);
  };

  const updateDateRange = async (
    newDateRange: DateRangeOption,
    newCustomDateRange?: DateRange | null
  ) => {
    setIsLoadingDateRange(true);
    setDateRange(newDateRange);
    if (newCustomDateRange !== undefined) {
      setCustomDateRange(newCustomDateRange);
    }
    setPage(1);
    setHasMore(true);
    await fetchData({
      orderBy,
      orderDirection,
      dateRange: newDateRange,
      customDateRange: newCustomDateRange !== undefined ? newCustomDateRange : customDateRange,
      page: 1,
    });
    setIsLoadingDateRange(false);
  };

  useEffect(() => {
    fetchData({
      shouldLoad: true,
    });
  }, []);

  return {
    isLoading,
    isLoadingMore,
    isLoadingOrderBy,
    isLoadingOrderDirection,
    isLoadingDateRange,
    error,
    fetchNextPage,
    hasMore,
    data,
    updateOrderBy,
    updateOrderDirection,
    updateDateRange,
    orderBy,
    orderDirection,
    dateRange,
    customDateRange,
  };
};
