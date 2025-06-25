"use client";

import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useEffect } from "react";

export default function OldHeatmap() {
  const router = useCustomRouter();
  useEffect(() => {
    router.redirect("/heatmap");
  }, []);

  return null;
}
