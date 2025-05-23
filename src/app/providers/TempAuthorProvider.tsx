"use client";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import axiosInstance from "@/lib/axios-instance";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TempAuthorProvider() {
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const pathname = usePathname();

  const authorId = searchParams.get("author");
  const loadingSetTempAuthorId = useRef(false);

  const setTempAuthorId = async () => {
    ;
    if (authorId && !loadingSetTempAuthorId.current) {
      loadingSetTempAuthorId.current = true;
      try {
        await axiosInstance.post(`/api/user/temp-author/${authorId}`);

        router.push(pathname, {
          paramsToRemove: ["author"],
        });
      } catch (error) {
        console.error("Error setting temp author id:", error);
      } finally {
        loadingSetTempAuthorId.current = false;
      }
    }
  };

  useEffect(() => {
    setTempAuthorId();
  }, [authorId]);

  return null;
}
