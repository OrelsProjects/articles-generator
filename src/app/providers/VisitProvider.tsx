"use client";

import axiosInstance from "@/lib/axios-instance";
import { useEffect } from "react";

const fetcher = (url: string) =>
  axiosInstance
    .post(url)
    .then(res => res.data)
    .catch(() => {});

export default function VisitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    fetcher("/api/visit");
  }, []);

  return children;
}
