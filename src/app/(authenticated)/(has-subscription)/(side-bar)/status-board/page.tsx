"use client";

import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useEffect } from "react";

export default function StatusBoardPage() {
  const router = useCustomRouter();
  useEffect(() => {
    router.redirect("/notes?view=kanban");
  });
}
