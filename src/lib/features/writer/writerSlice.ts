// src/lib/features/writers/writersSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WriterWithData } from "@/types/writer";
import { Article } from "@/types/article";

interface WriterState {
  writers: Record<string, WriterWithData | null>;
  articles: Record<string, Article[]>;
  articlesPages: Record<string, number>;
  hasMoreArticles: Record<string, boolean>;
  loading: Record<string, boolean>;
  loadingArticles: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: WriterState = {
  writers: {},
  articles: {},
  articlesPages: {},
  hasMoreArticles: {},
  loading: {},
  loadingArticles: {},
  errors: {},
};

export const writersSlice = createSlice({
  name: "writers",
  initialState,
  reducers: {
    setWriter: (
      state,
      action: PayloadAction<{ handle: string; writer: WriterWithData | null }>,
    ) => {
      const { handle, writer } = action.payload;
      state.writers[handle] = writer;
    },

    setArticles: (
      state,
      action: PayloadAction<{
        handle: string;
        articles: Article[];
        isFirstPage?: boolean;
      }>,
    ) => {
      const { handle, articles, isFirstPage } = action.payload;

      if (isFirstPage || !state.articles[handle]) {
        state.articles[handle] = articles;
      } else {
        // Merge articles, removing duplicates
        const existingArticles = state.articles[handle] || [];
        const newArticles = [...existingArticles, ...articles];
        const uniqueArticles = newArticles.filter(
          (article, index, self) =>
            index === self.findIndex(a => a.id === article.id),
        );
        state.articles[handle] = uniqueArticles;
      }
    },

    setArticlesPage: (
      state,
      action: PayloadAction<{ handle: string; page: number }>,
    ) => {
      const { handle, page } = action.payload;
      state.articlesPages[handle] = page;
    },

    setHasMoreArticles: (
      state,
      action: PayloadAction<{ handle: string; hasMore: boolean }>,
    ) => {
      const { handle, hasMore } = action.payload;
      state.hasMoreArticles[handle] = hasMore;
    },

    setLoading: (
      state,
      action: PayloadAction<{ handle: string; loading: boolean }>,
    ) => {
      const { handle, loading } = action.payload;
      state.loading[handle] = loading;
    },

    setLoadingArticles: (
      state,
      action: PayloadAction<{ handle: string; loading: boolean }>,
    ) => {
      const { handle, loading } = action.payload;
      state.loadingArticles[handle] = loading;
    },

    setError: (
      state,
      action: PayloadAction<{ handle: string; error: string | null }>,
    ) => {
      const { handle, error } = action.payload;
      state.errors[handle] = error;
    },
  },
});

export const {
  setWriter,
  setArticles,
  setArticlesPage,
  setHasMoreArticles,
  setLoading,
  setLoadingArticles,
  setError,
} = writersSlice.actions;

// Selectors
export const selectWriter = (state: { writers: WriterState }, handle: string) =>
  state.writers.writers[handle];

export const selectArticles = (
  state: { writers: WriterState },
  handle: string,
) => state.writers.articles[handle] || [];

export const selectArticlesPage = (
  state: { writers: WriterState },
  handle: string,
) => state.writers.articlesPages[handle] || 1;

export const selectHasMoreArticles = (
  state: { writers: WriterState },
  handle: string,
) => state.writers.hasMoreArticles[handle] ?? true;

export const selectLoadingArticles = (
  state: { writers: WriterState },
  handle: string,
) => state.writers.loadingArticles[handle] || false;

export const selectLoading = (
  state: { writers: WriterState },
  handle: string,
) => state.writers.loading[handle] || false;

export const selectError = (state: { writers: WriterState }, handle: string) =>
  state.writers.errors[handle] || null;

export default writersSlice.reducer;
