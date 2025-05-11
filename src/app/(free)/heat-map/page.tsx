"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function OldHeatmap() {
  useEffect(() => {
    redirect("/heatmap");
  }, []);

  return null;
}
