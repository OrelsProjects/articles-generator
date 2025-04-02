import { WriterWithData } from "@/types/writer";
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { useState } from "react";

export const useWriter = (handle: string) => {
  const [writer, setWriter] = useState<WriterWithData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);

  const fetchWriter = async (page: number = 1) => {
    if (!hasMore) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (page !== 1) {
      setIsLoadingMore(true);
    }
    try {
      const response = await axios.get<{
        writer: WriterWithData;
        hasMore: boolean;
      }>(`/api/writer/${handle}?page=${page}`);
      if (page === 1 || !writer) {
        setWriter(response.data.writer);
      } else {
        const currentWriter = writer as WriterWithData;
        const newTopNotes = [
          ...currentWriter.topNotes,
          ...response.data.writer.topNotes,
        ];
        const newTopArticles = [
          ...currentWriter.topArticles,
          ...response.data.writer.topArticles,
        ];

        const uniqueNotes = newTopNotes.filter(
          (note, index, self) =>
            index === self.findIndex(t => t.id === note.id),
        );

        const uniqueArticles = newTopArticles.filter(
          (article, index, self) =>
            index === self.findIndex(t => t.id === article.id),
        );

        setWriter({
          ...currentWriter,
          topNotes: uniqueNotes,
          topArticles: uniqueArticles,
        });
      }
      setHasMore(response.data.hasMore);
    } catch (err) {
      console.error(err);
      setError(err as Error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWriter();
  }, [handle]);

  const fetchNextPage = () => {
    fetchWriter(page + 1).then(() => {
      setPage(page + 1);
    });
  };

  const fetchAuthorNotes = useCallback(
    async (options: { authorId: string }) => {
      await axios.post("/api/admin/fetch-writer", options);
    },
    [],
  );

  return {
    writer,
    isLoading,
    isLoadingMore,
    error,
    fetchNextPage,
    hasMore,
    fetchAuthorNotes,
  };
};
