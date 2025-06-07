import { WriterWithData } from "@/types/writer";
import { useCallback, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios-instance";
import { useState } from "react";
import { Article } from "@/types/article";
import { Logger } from "@/logger";

export const useWriter = (handle?: string) => {
  const [writer, setWriter] = useState<WriterWithData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Articles (posts) related state
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articlesPage, setArticlesPage] = useState(1);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [articlesError, setArticlesError] = useState<Error | null>(null);

  const loadingRef = useRef(false);
  const loadingArticlesRef = useRef(false);
  const loadingUserWriterDataRef = useRef(false);

  const fetchWriter = async (page: number = 1) => {
    if (!hasMore) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (page !== 1) {
      setIsLoadingMore(true);
    }
    try {
      const url = handle ? `/api/writer/${handle}?page=${page}` : `/api/writer/me?page=${page}`;
      const response = await axiosInstance.get<{
        writer: WriterWithData;
        hasMore: boolean;
      }>(url);
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
      Logger.error(String(err));
      setError(err as Error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchPosts = async (page: number = 1, forceReload: boolean = false) => {
    if (!forceReload) {
      if (!hasMoreArticles) return;
      if (loadingArticlesRef.current) return;
    }
    loadingArticlesRef.current = true;

    setIsLoadingArticles(true);

    try {
      let newPage = page;
      if (articles.length === 0) {
        newPage = 1;
      }
      const response = await axiosInstance.get<{
        articles: Article[];
        hasMore: boolean;
      }>(`/api/user/posts?page=${newPage}`);

      setArticlesPage(newPage);
      if (newPage === 1) {
        setArticles(response.data.articles);
      } else {
        const newArticles = [...articles, ...response.data.articles];
        const uniqueArticles = newArticles.filter(
          (article, index, self) =>
            index === self.findIndex(t => t.id === article.id),
        );
        setArticles(uniqueArticles);
      }

      setHasMoreArticles(response.data.hasMore);
    } catch (err) {
      Logger.error("Error fetching posts", { error: String(err) });
      setArticlesError(err as Error);
    } finally {
      loadingArticlesRef.current = false;
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    // Always fetch, handle null handle for current user
    fetchWriter();
  }, [handle]);

  const fetchNextPage = () => {
    fetchWriter(page + 1).then(() => {
      setPage(page + 1);
    });
  };

  const fetchNextArticlesPage = () => {
    fetchPosts(articlesPage + 1).then(() => {
      setArticlesPage(articlesPage + 1);
    });
  };

  const fetchUserWriterData = async () => {
    if (loadingUserWriterDataRef.current) return;
    loadingUserWriterDataRef.current = true;
    try {
      const response = await axiosInstance.get<{
        writer: WriterWithData;
      }>(`/api/user/writer-data`);
      setWriter(response.data.writer);
    } catch (err) {
      Logger.error("Error fetching user writer data", { error: String(err) });
    } finally {
      loadingUserWriterDataRef.current = false;
    }
  };

  const fetchAuthorNotes = useCallback(
    async (options: { authorId: string }) => {
      await axiosInstance.post("/api/admin/fetch-writer", options);
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
    fetchUserWriterData,

    // Articles (posts) related data
    articles,
    isLoadingArticles,
    hasMoreArticles,
    articlesError,
    fetchPosts,
    fetchNextArticlesPage,
  };
};
