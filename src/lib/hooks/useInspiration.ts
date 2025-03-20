import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setLoadingInspiration,
  setError,
  setInspirationFilters,
  addInspirationNotes,
  setInspirationNotes,
} from "@/lib/features/inspiration/inspirationSlice";
import axios from "axios";
import { EventTracker } from "@/eventTracker";
import { InspirationFilters } from "@/types/note";
import { NotesComments } from "../../../prisma/generated/articles";

export function useInspiration() {
  const dispatch = useAppDispatch();
  const {
    inspirationNotes,
    loadingInspiration,
    error,
    filters,
    hasMoreInspirationNotes,
  } = useAppSelector(state => state.inspiration);

  const loadingInspirationRef = useRef(false);

  const fetchInspirationNotes = useCallback(
    async (
      loadMore = false,
      newFilters?: Partial<InspirationFilters>,
      existingNotes?: NotesComments[],
    ) => {
      if (loadingInspirationRef.current) return;
      try {
        if (inspirationNotes.length > 0) {
          EventTracker.track("notes_inspiration_load_more");
        }
        loadingInspirationRef.current = true;
        dispatch(setLoadingInspiration(true));

        const response = await axios.post("/api/notes/inspiration", {
          existingNotesIds: loadMore
            ? existingNotes
              ? existingNotes.map(note => note.id)
              : inspirationNotes.map(note => note.id)
            : [],
          cursor: loadMore
            ? inspirationNotes[inspirationNotes.length - 1]?.id
            : null,
          filters: newFilters || filters,
        });
        dispatch(setError(null));
        if (loadMore) {
          dispatch(
            addInspirationNotes({
              items: response.data.items,
              nextCursor: response.data.nextCursor,
              hasMore: response.data.hasMore,
              options: { toStart: false },
            }),
          );
        } else {
          dispatch(setInspirationNotes(response.data.items));
        }
      } catch (error) {
        dispatch(
          setError(
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          ),
        );
        console.error("Error fetching inspiration notes:", error);
      } finally {
        dispatch(setLoadingInspiration(false));
        loadingInspirationRef.current = false;
      }
    },
    [inspirationNotes, filters],
  );

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
      dispatch(setInspirationFilters(updatedFilters));
      dispatch(setInspirationNotes([]));
      fetchInspirationNotes(false, updatedFilters, []);
    },
    [dispatch, filters, fetchInspirationNotes],
  );

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
    updateFilters,
    fetchInspirationNotes,
    loadMore: () => fetchInspirationNotes(true),
    hasMoreInspirationNotes,
  };
}
