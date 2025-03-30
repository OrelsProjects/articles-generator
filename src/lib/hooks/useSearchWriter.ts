import { useRef, useState } from "react";
import { WriterSearchResult } from "@/types/writer";
import axios, { AxiosError } from "axios";

export function useSearchWriter() {
  const [result, setResult] = useState<WriterSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelRef = useRef<AbortController | null>(null);

  const search = async (query: string) => {
    if (cancelRef.current) {
      cancelRef.current.abort();
    }
    cancelRef.current = new AbortController();
    try {
      setLoading(true);
      const response = await axios.post<WriterSearchResult[]>(
        `/api/writer/search`,
        { query },
        { signal: cancelRef.current.signal },
      );
      setResult(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { result, search, loading, error };
}
