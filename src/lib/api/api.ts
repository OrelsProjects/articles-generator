import { NoteDraft, NoteDraftBody, NoteStatus } from "@/types/note";
import axios, { AxiosRequestConfig } from "axios";

export async function createNoteDraft(
  note: {
    body: string;
    status: NoteStatus;
  },
  config: AxiosRequestConfig,
) {
  const response = await axios.post<NoteDraft>(
    "/api/note",
    note,
    { ...config },
  );
  return response.data;
}

export async function updateNoteDraft(
  id: string,
  partialNote: Partial<NoteDraftBody>,
  config: AxiosRequestConfig,
) {
  await axios.patch<NoteDraft[]>(`/api/note/${id}`, partialNote, {
    ...config,
  });
}