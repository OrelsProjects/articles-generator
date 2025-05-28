"use client";

import axiosInstance from "@/lib/axios-instance";
import { addNotes } from "@/lib/features/notes/notesSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { Logger } from "@/logger";
import { Byline } from "@/types/article";
import { FreeToolPage } from "@/types/free-tool-page";
import { NoteDraft } from "@/types/note";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const generateMockData = (
  name: string,
  handle: string,
  photoUrl: string,
): NoteDraft[] => {
  return [
    {
      id: "682c8556b02c48e098e442f5",
      body: `Well butter my backside and call me a biscuit.
      \n\n
      Caught you snoopin’ round my DOM like a raccoon at 2 AM.
      \n\n
      Yes, I see ya. No, the registration ain’t optional.`,
      createdAt: new Date("2025-05-20T13:36:22.023Z"),
      authorId: 51141391,
      name,
      handle,
      status: "inspiration" as const,
      authorName: name,
      thumbnail: photoUrl,
      isArchived: false,
      wasSentViaSchedule: false,
      attachments: [],
    },
    {
      id: "682c851db02c48e098e442f4",
      body: `Put that fancy “Inspector” away, sign your hide up,
      \n\n
      and earn the right to read the real goods.`,
      createdAt: new Date("2025-05-20T13:35:25.792Z"),
      authorId: 51141391,
      name,
      handle,
      status: "inspiration" as const,
      authorName: name,
      thumbnail: photoUrl,
      isArchived: false,
      wasSentViaSchedule: false,
      attachments: [],
    },
    {
      id: "682c82d1b02c48e098e442e8",
      body: `P.S. Keep pushin’ buttons and I’ll replace your
      \n\n
      Ctrl key with a self-destruct timer. Bless your heart.`,
      createdAt: new Date("2025-05-20T13:25:37.707Z"),
      authorId: 51141391,
      name,
      handle,
      status: "inspiration" as const,
      authorName: name,
      thumbnail: photoUrl,
      isArchived: false,
      wasSentViaSchedule: false,
      attachments: [],
    },
  ];
};

export function useNotesGeneratorPost(): FreeToolPage<NoteDraft[]> {
  const [postUrl, setPostUrl] = useLocalStorage<string | null>(
    "free_post_url",
    null,
  );
  const dispatch = useAppDispatch();
  const { userNotes } = useAppSelector(state => state.notes);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedByline, setSelectedByline] = useState<Byline | null>(null);
  const [notes, setNotes] = useState<NoteDraft[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [nextGenerateDate, setNextGenerateDate] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const generatingNote = useRef<boolean>(false);
  const fetchingTodaysNotes = useRef<boolean>(false);
  const loadingUserDataRef = useRef(false);

  // if userNotes changes, update the notes useState
  useEffect(() => {
    setNotes(userNotes);
  }, [userNotes]);

  const handleBylineSelect = async (byline: Byline) => {
    setSelectedByline(byline);
  };

  const generateNote = async (postUrl: string) => {
    if (generatingNote.current) {
      return;
    }
    setIsLoading(true);
    generatingNote.current = true;
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        notes: NoteDraft[];
        nextGenerateDate: string | null;
        requiresLogin: boolean;
        canGenerate: boolean;
      }>(`/api/generate-note-from-post`, {
        postUrl,
        authorId: selectedByline?.authorId,
      });

      if (response.data.success) {
        if (response.data.requiresLogin) {
          setPostUrl(postUrl);
          setShowLoginDialog(true);
          if ("canGenerate" in response.data) {
            setCanGenerate(response.data.canGenerate);
          }
          setNotes(
            generateMockData(
              selectedByline?.name || "",
              selectedByline?.handle || "",
              selectedByline?.photoUrl || "",
            ),
          );
          return;
        }
        const newNotes = [...notes, ...response.data.notes];
        const notesSortedByCreatedAt = newNotes.sort(
          (a, b) =>
            new Date(a.createdAt || "").getTime() -
            new Date(b.createdAt || "").getTime(),
        );
        setNotes(notesSortedByCreatedAt);
        dispatch(
          addNotes({
            items: response.data.notes,
            nextCursor: null,
            options: { toStart: false },
          }),
        );
        setNextGenerateDate(response.data.nextGenerateDate);
      } else {
        setShowLoginDialog(true);
      }
    } catch (error: any) {
      Logger.error("Error generating note:", {
        error,
      });
      // if 402, set data to null
      if (error.response.status === 402 && error.response.data) {
        setNotes(error.response.data.todaysNotes);
        setCanGenerate(false);
        const nextGenerateDate = error.response.data.nextGenerateDate;
        if (nextGenerateDate) {
          setNextGenerateDate(nextGenerateDate);
        }
        return;
      }
      throw error;
    } finally {
      generatingNote.current = false;
      setIsLoading(false);
    }
  };

  const handleCloseLoginDialog = (open: boolean) => {
    setShowLoginDialog(open);
    if (!open) {
      setShowLoginDialog(false);
      setNotes([]);
    }
  };

  const getLoginRedirect = () => {
    let redirect = {
      pathname: "note-generator/post",
      query: {},
    };
    if (selectedByline) {
      redirect = {
        pathname: "note-generator/post",
        query: {
          author: selectedByline.authorId,
        },
      };
    }
    Logger.info("[USE-NOTES-GENERATOR-POST] Redirecting to", { redirect });
    return redirect;
  };

  const getTodaysNotes = async () => {
    if (fetchingTodaysNotes.current || notes.length > 0) {
      return;
    }
    fetchingTodaysNotes.current = true;
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: NoteDraft[];
        canGenerate: boolean;
        nextGenerateDate: string | null;
      }>(`/api/generate-note-from-post`);
      if (response.data.success) {
        setNotes(response.data.data);
        if ("canGenerate" in response.data) {
          setCanGenerate(response.data.canGenerate);
        }
        dispatch(
          addNotes({
            items: response.data.data,
            nextCursor: null,
            options: { toStart: false },
          }),
        );
        if (!response.data.canGenerate && response.data.nextGenerateDate) {
          setNextGenerateDate(response.data.nextGenerateDate);
        }
      }
    } catch (error: any) {
      Logger.error("Error getting todays notes:", { error });
    } finally {
      fetchingTodaysNotes.current = false;
    }
  };

  const getAuthorId = async () => {
    try {
      const response = await axiosInstance.get("/api/user/temp-author");
      return response.data;
    } catch (error) {
      Logger.error("Error fetching author ID:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  };

  const fetchUserData = async () => {
    if (loadingUserDataRef.current) return;

    let authorId = session?.user?.meta?.tempAuthorId;

    if (!authorId) {
      authorId = await getAuthorId();
    }
    if (!authorId) {
      return;
    }

    loadingUserDataRef.current = true;

    try {
      const publicationRes = await axiosInstance.get<{
        authorId: number;
        name: string;
        image: string;
        handle: string;
        bio: string;
      }>("/api/user/publication");
      setSelectedByline({
        authorId: publicationRes.data.authorId,
        name: publicationRes.data.name,
        photoUrl: publicationRes.data.image,
        handle: publicationRes.data.handle,
        bio: publicationRes.data.bio,
      });
    } catch (error) {
      // do nothing
    } finally {
      loadingUserDataRef.current = false;
    }
  };

  const removeNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  useEffect(() => {
    fetchUserData();
    getTodaysNotes();
    if (postUrl) {
      generateNote(postUrl).then(() => {
        setPostUrl(null);
      });
    }
  }, []);

  return {
    isLoading,
    selectedByline,
    data: notes,
    showLoginDialog,
    handleBylineSelect,
    hasData: notes.length > 0,
    authorName: selectedByline?.name || "",
    authorImage: selectedByline?.photoUrl || "",
    isInputDisabled: selectedByline !== null,
    handleCloseLoginDialog,
    getLoginRedirect,
    generateNote,
    removeNote,
    nextGenerateDate,
    canGenerate,
  };
}
