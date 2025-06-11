import { Article } from "@/types/article";
import { Note } from "@/types/note";
import {
  NotesAttachments,
  NotesComments,
  Post,
} from "../../prisma/generated/articles";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import { AttachmentType } from "@prisma/client";

export interface Writer {
  bio: string;
  handle: string;
  name: string;
  photoUrl: string;
  authorId: string;
}

export interface WriterWithData extends Writer {
  topNotes: Note[];
  topArticles: Article[];
}

export interface UserWriterWithData extends Writer {
  topNotes: NoteWithEngagementStats[];
}

export interface WriterSearchResult extends Writer {
  id: string;
}

export const DBNotesToNotes = (
  note: (NotesComments & { attachments?: NotesAttachments[] })[],
): Note[] => {
  const notes: Note[] = note.map(note => ({
    id: note.id.toString(),
    entityKey: note.entityKey,
    content: note.body,
    thumbnail: note.photoUrl || undefined,
    body: note.body,
    createdAt: note.date,
    authorId: Number(note.authorId),
    authorName: note.name || "",
    handle: note.handle || "",
    reactionCount: note.reactionCount,
    commentsCount: note.commentsCount || 0,
    restacks: note.restacks,
    attachments: note.attachments?.map(att => ({
      id: att.id.toString(),
      type: att.type as AttachmentType,
      url: att.imageUrl || "",
    })) || [],
  }));

  return notes;
};

export const DBArticlesToArticles = (article: Post[]): Article[] => {
  return article.map(article => ({
    ...article,
    canonicalUrl: article.canonicalUrl || "",
  }));
};
