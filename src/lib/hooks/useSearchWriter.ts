import { useRef, useState } from "react";
import { WriterSearchResult } from "@/types/writer";
import axios, { AxiosError } from "axios";

export function useSearchWriter() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WriterSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingMoreRef = useRef(loadingMore);
  const cancelRef = useRef<AbortController | null>(null);
  const queryRef = useRef("");

  const search = async (
    query: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }
    cancelRef.current = new AbortController();
    if (!query) {
      setResult([]);
      setHasMore(true);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post<WriterSearchResult[]>(
        `/api/writer/search`,
        { query, page, limit },
        { signal: cancelRef.current.signal },
      );
      if (page > 1) {
        setResult(prev => [...prev, ...response.data]);
      } else {
        setResult(response.data);
      }
      setHasMore(response.data.length === limit);
      setLoading(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        // if it's a cancelled error, don't set an error
        if (error.code === "ERR_CANCELED") return;
        console.error(error.response?.data);
      }
      setError(error instanceof Error ? error.message : "An error occurred");
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!queryRef.current) return;
    if (loadingMoreRef.current) return;
    if (!hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setPage(page + 1);
    await search(queryRef.current, page + 1, 10);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  };

  const updateQuery = (query: string) => {
    setQuery(query);
    queryRef.current = query;
    setPage(1);
    setHasMore(true);
  };

  return {
    result,
    search,
    loading,
    error,
    loadMore,
    hasMore,
    updateQuery,
    query,
    loadingMore,
  };
}
