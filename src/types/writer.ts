import { Article } from "@/types/article";
import { Note } from "@/types/note";
import {
  NotesAttachments,
  NotesComments,
  Post,
} from "../../prisma/generated/articles";

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

export interface WriterSearchResult extends Writer {
  id: string;
}

export const DBNotesToNotes = (
  note: (NotesComments & { attachments?: NotesAttachments[] })[],
): Note[] => {
  return note.map(note => ({
    id: note.id.toString(),
    entityKey: note.entityKey,
    content: note.body,
    thumbnail: note.photoUrl || undefined,
    body: note.body,
    jsonBody: Array.isArray(note.bodyJson) ? note.bodyJson : [],
    createdAt: note.date,
    authorId: Number(note.authorId),
    authorName: note.name || "",
    handle: note.handle || "",
    reactionCount: note.reactionCount,
    commentsCount: note.commentsCount || 0,
    restacks: note.restacks,
    attachment: note.attachments?.map(att => att.imageUrl || "") || [],
  }));
};

export const DBArticlesToArticles = (article: Post[]): Article[] => {
  return article.map(article => ({
    ...article,
    canonicalUrl: article.canonicalUrl || "",
  }));
};
