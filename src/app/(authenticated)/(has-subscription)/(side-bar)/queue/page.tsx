"use client";

import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function QueuePage() {
  const router = useCustomRouter();
  useEffect(() => {
    router.redirect("/notes?view=list");
  }, []);
}
