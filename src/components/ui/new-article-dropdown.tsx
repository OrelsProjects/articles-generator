"use client";

import { useMemo, useState } from "react";
import { Plus, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { useIdea } from "@/lib/hooks/useIdea";
import { toast } from "react-toastify";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import SendToDraftButton from "@/components/ui/send-to-draft-button";

interface NewArticleDropdownProps {
  onCreateNew: () => void;
}

export default function NewArticleDropdown() {
  const [loadingNewIdea, setLoadingNewIdea] = useState(false);
  const { selectedIdea, publications } = useAppSelector(selectPublications);
  const { createNewIdea } = useIdea();

  const publication = useMemo(() => {
    return publications[0];
  }, [publications, selectedIdea]);

  const handleCreateNewIdea = () => {
    setLoadingNewIdea(true);
    createNewIdea({ showIdeasAfterCreate: true })
      .catch((error: any) => {
        toast.error(error.response?.data?.error || "Failed to create new idea");
      })
      .finally(() => {
        setLoadingNewIdea(false);
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-8 w-fit px-2 py-4 space-x-2"
          disabled={loadingNewIdea}
        >
          {loadingNewIdea ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
          )}
          <p className="text-sm pr-1">New</p>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={handleCreateNewIdea}
          className="hover:cursor-pointer"
        >
          <StickyNote className="w-4 h-4 mr-2" />
          Draft
        </DropdownMenuItem>
        <GenerateIdeasButton
          variant="ghost"
          className="w-full h-fit font-normal text-sm pl-2 flex justify-start py-1.5"
        />

        {!!selectedIdea && (
          <DropdownMenuItem asChild className="hover:cursor-pointer">
            <SendToDraftButton
              publicationUrl={publication?.url || null}
              variant="ghost"
              className="w-full h-fit font-normal text-sm pl-0 gap-2 !py-1.5"
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
