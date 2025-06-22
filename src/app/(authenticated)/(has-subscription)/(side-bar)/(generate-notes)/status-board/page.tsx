"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function StatusBoardPage() {
  useEffect(() => {
    redirect("/notes?view=kanban");
  });
}
