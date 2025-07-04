import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setLoadingInspiration,
  setError,
  setInspirationFilters,
  addInspirationNotes,
  setInspirationNotes,
  setInspirationSort,
  setCurrentPage,
} from "@/lib/features/inspiration/inspirationSlice";
import { AxiosError } from "axios";
import { EventTracker } from "@/eventTracker";
import {
  InspirationFilters,
  InspirationNote,
  InspirationSort,
  InspirationSortDirection,
  InspirationSortType,
} from "@/types/note";
import { NotesComments } from "../../../prisma/generated/articles";
import { Logger } from "@/logger";
import axiosInstance from "@/lib/axios-instance";

export function useInspiration() {
  const dispatch = useAppDispatch();
  const {
    inspirationNotes,
    loadingInspiration,
    error,
    filters,
    sort,
    hasMoreInspirationNotes,
    currentPage,
    hasMore,
  } = useAppSelector(state => state.inspiration);
  const [originalInspirationNotes, setOriginalInspirationNotes] =
    useState<InspirationNote[]>(inspirationNotes);
  const [construction] = useState(false);
  const cancelRef = useRef<AbortController | null>(null);

  const loadingInspirationRef = useRef(false);

  const fetchInspirationNotes = async (
    options: {
      page: number;
      newFilters?: Partial<InspirationFilters>;
      existingNotes?: NotesComments[];
    } = {
      page: 1,
      newFilters: undefined,
      existingNotes: undefined,
    },
  ) => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }
    cancelRef.current = new AbortController();
    try {
      const { page, newFilters, existingNotes } = options;
      if (inspirationNotes.length > 0) {
        EventTracker.track("notes_inspiration_load_more");
      }
      loadingInspirationRef.current = true;
      dispatch(setLoadingInspiration(true));

      const response = await axiosInstance.post<{
        items: InspirationNote[];
        hasMore: boolean;
      }>(
        "/api/notes/inspiration",
        {
          existingNotesIds: existingNotes
            ? existingNotes.map(note => note.id)
            : inspirationNotes.map(note => note.id),
          page: page,
          filters: newFilters || filters,
        },
        { signal: cancelRef.current?.signal },
      );
      dispatch(setError(null));
      const sortedNotes = sortNotes(
        response.data.items,
        sort.type,
        sort.direction,
      );
      if (page > 1) {
        dispatch(
          addInspirationNotes({
            items: sortedNotes,
            hasMore: response.data.hasMore,
            options: { toStart: false },
          }),
        );
      } else {
        dispatch(setInspirationNotes(sortedNotes));
      }
      dispatch(setLoadingInspiration(false));
      loadingInspirationRef.current = false;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === "ERR_CANCELED") return;
      }
      dispatch(
        setError(
          error instanceof Error ? error.message : "An unknown error occurred",
        ),
      );
      Logger.error("Error fetching inspiration notes:", {
        error: String(error),
      });
      dispatch(setLoadingInspiration(false));
      loadingInspirationRef.current = false;
    }
  };

  const updateFilters = useCallback(
    (newFilters?: Partial<InspirationFilters>) => {
      let updatedFilters: InspirationFilters | undefined;
      const hasFilters = newFilters
        ? Object.keys(newFilters).length > 0
        : false;
      if (!hasFilters) {
        updatedFilters = {
          type: "all",
        };
      } else {
        updatedFilters = { ...filters, ...newFilters };
      }
      if (updatedFilters.keyword) {
        updatedFilters.type = "all";
      } else {
        updatedFilters.type = "relevant-to-user";
      }
      dispatch(setInspirationFilters(updatedFilters));
      dispatch(setInspirationNotes([]));
      dispatch(setError(null));
      dispatch(setCurrentPage(1));
      fetchInspirationNotes({
        page: 1,
        newFilters: updatedFilters,
        existingNotes: [],
      });
    },
    [dispatch, filters, fetchInspirationNotes],
  );

  const sortNotes = (
    notes: InspirationNote[],
    type: InspirationSortType,
    direction: InspirationSortDirection = "desc",
  ) => {
    let sortedNotes: InspirationNote[] = [];
    switch (type) {
      case "relevance":
        sortedNotes = [...notes].sort((a, b) => {
          return b.score - a.score;
        });
        break;
      case "date":
        sortedNotes = [...notes].sort((a, b) => {
          if (direction === "asc") {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          } else {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        });
        break;
      case "likes":
        sortedNotes = [...notes].sort((a, b) => {
          if (direction === "asc") {
            return a.reactionCount - b.reactionCount;
          } else {
            return b.reactionCount - a.reactionCount;
          }
        });
        break;
      case "comments":
        sortedNotes = [...notes].sort((a, b) => {
          if (direction === "asc") {
            return a.commentsCount - b.commentsCount;
          } else {
            return b.commentsCount - a.commentsCount;
          }
        });
        break;
      case "restacks":
        sortedNotes = [...notes].sort((a, b) => {
          if (direction === "asc") {
            return a.restacks - b.restacks;
          } else {
            return b.restacks - a.restacks;
          }
        });
        break;
    }
    return sortedNotes;
  };

  const updateSort = useCallback(
    (newSort: InspirationSort) => {
      dispatch(setInspirationSort(newSort));
      const sortedNotes = sortNotes(
        inspirationNotes,
        newSort.type,
        newSort.direction,
      );
      dispatch(setInspirationNotes(sortedNotes));
    },
    [inspirationNotes],
  );

  const loadMore = useCallback(async () => {
    await fetchInspirationNotes({ page: currentPage + 1 });
    dispatch(setCurrentPage(currentPage + 1));
  }, [fetchInspirationNotes]);

  useEffect(() => {
    if (inspirationNotes.length === 0 && !construction) {
      fetchInspirationNotes();
    }
  }, [construction]);

  const blockWriter = useCallback(
    async (authorId: string) => {
      try {
        await axiosInstance.post("/api/v1/writer/block", { authorId });
        setOriginalInspirationNotes(inspirationNotes);
        dispatch(
          setInspirationNotes(
            originalInspirationNotes.filter(
              note => note.authorId.toString() !== authorId,
            ),
          ),
        );
      } catch (error: any) {
        Logger.error("Error blocking writer:", error);
        throw error;
      }
    },
    [inspirationNotes],
  );

  const unblockWriter = useCallback(async (authorId: string) => {
    try {
      await axiosInstance.delete("/api/v1/writer/block", {
        data: { authorId },
      });
      dispatch(setInspirationNotes(originalInspirationNotes));
    } catch (error: any) {
      Logger.error("Error unblocking writer:", error);
      throw error;
    }
  }, []);

  return {
    notes: inspirationNotes,
    loading: loadingInspiration,
    error,
    filters,
    sort,
    updateFilters,
    fetchInspirationNotes,
    loadMore,
    hasMoreInspirationNotes,
    updateSort,
    hasMore,
    construction,
    blockWriter,
    unblockWriter,
  };
}
