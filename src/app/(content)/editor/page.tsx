"use client";

import { IdeasPanel } from "@/components/ui/text-editor/ideas-panel";
import TextEditor from "@/components/ui/text-editor/text-editor";
import { useAppSelector } from "@/lib/hooks/redux";
import { Idea } from "@/models/idea";
import React, { useMemo, useState } from "react";

export default function Ideas() {
  const { publications, ideas } = useAppSelector(state => state.publications);
  const [ideaSelected, setIdeaSelected] = useState<Idea | null>(
    ideas[0] || null,
  );

  const handleSelectIdea = (idea: Idea) => {
    setIdeaSelected(idea);
  };

  return (
    <div className="w-full h-screen flex flex-row overflow-clip">
      <TextEditor publication={publications[0]} ideaSelected={ideaSelected} />
      <IdeasPanel ideas={ideas} onSelectIdea={handleSelectIdea} />
    </div>
  );
}
