import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setLoadingInspiration,
  setError,
  setInspirationFilters,
  addInspirationNotes,
  setInspirationNotes,
  setInspirationSort,
} from "@/lib/features/inspiration/inspirationSlice";
import axios, { AxiosError } from "axios";
import { EventTracker } from "@/eventTracker";
import {
  InspirationFilters,
  InspirationNote,
  InspirationSort,
  InspirationSortType,
} from "@/types/note";
import { NotesComments } from "../../../prisma/generated/articles";

export function useInspiration() {
  const dispatch = useAppDispatch();
  const {
    inspirationNotes,
    loadingInspiration,
    error,
    filters,
    sort,
    hasMoreInspirationNotes,
  } = useAppSelector(state => state.inspiration);
  const cancelRef = useRef<AbortController | null>(null);

  const loadingInspirationRef = useRef(false);

  const fetchInspirationNotes = async (
    loadMore = false,
    newFilters?: Partial<InspirationFilters>,
    existingNotes?: NotesComments[],
  ) => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }
    cancelRef.current = new AbortController();
    try {
      if (inspirationNotes.length > 0) {
        EventTracker.track("notes_inspiration_load_more");
      }
      loadingInspirationRef.current = true;
      dispatch(setLoadingInspiration(true));

      const response = await axios.post<{
        items: InspirationNote[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(
        "/api/notes/inspiration",
        {
          existingNotesIds: loadMore
            ? existingNotes
              ? existingNotes.map(note => note.id)
              : inspirationNotes.map(note => note.id)
            : [],
          cursor: loadMore
            ? inspirationNotes[inspirationNotes.length - 1]?.id
            : null,
          filters: newFilters || filters,
        },
        { signal: cancelRef.current?.signal },
      );
      dispatch(setError(null));
      const sortedNotes = sortNotes(sort.type, response.data.items);
      if (loadMore) {
        dispatch(
          addInspirationNotes({
            items: sortedNotes,
            nextCursor: response.data.nextCursor,
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
      console.error("Error fetching inspiration notes:", error);
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
      fetchInspirationNotes(false, updatedFilters, []);
    },
    [dispatch, filters, fetchInspirationNotes],
  );

  const sortNotes = (type: InspirationSortType, notes: InspirationNote[]) => {
    let sortedNotes: InspirationNote[] = [];
    switch (type) {
      case "relevance":
        sortedNotes = [...notes].sort((a, b) => {
          return b.score - a.score;
        });
        break;
      case "date":
        sortedNotes = [...notes].sort((a, b) => {
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        break;
      case "likes":
        sortedNotes = [...notes].sort((a, b) => {
          return b.reactionCount - a.reactionCount;
        });
        break;
      case "comments":
        sortedNotes = [...notes].sort((a, b) => {
          return b.commentsCount - a.commentsCount;
        });
        break;
      case "restacks":
        sortedNotes = [...notes].sort((a, b) => {
          return b.restacks - a.restacks;
        });
        break;
    }
    return sortedNotes;
  };

  const updateSort = (newSort: InspirationSortType) => {
    dispatch(setInspirationSort({ ...sort, type: newSort }));
    dispatch(setInspirationNotes(sortNotes(newSort, inspirationNotes)));
  };

  useEffect(() => {
    if (inspirationNotes.length === 0) {
      fetchInspirationNotes();
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
    loadMore: () => fetchInspirationNotes(true),
    hasMoreInspirationNotes,
    updateSort,
  };
}
