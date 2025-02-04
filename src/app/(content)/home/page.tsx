"use client";

import TextEditor from "@/components/ui/text-editor/text-editor";
import { useAppSelector } from "@/lib/hooks/redux";
import React from "react";

export default function Home() {
  const { publicationIds } = useAppSelector(state => state.publications);

  console.log(publicationIds);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <TextEditor publicationId={publicationIds[0] || null} />
    </div>
  );
}
