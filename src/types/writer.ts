import { Article } from "@/types/article";
import { Note } from "@/types/note";
import {
  NotesAttachments,
  NotesComments,
  Post,
} from "../../prisma/generated/articles";

export interface Writer {
  topNotes: Note[];
  topArticles: Article[];
  bio: string;
  handle: string;
  name: string;
  photoUrl: string;
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
    timestamp: note.date,
    authorId: note.authorId,
    authorName: note.name || "",
    handle: note.name || "",
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
