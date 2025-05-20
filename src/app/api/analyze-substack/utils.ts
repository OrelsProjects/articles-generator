import { prismaArticles } from "@/lib/prisma";
import { fetchWithHeaders } from "@/lib/utils/requests";
import { NotesComments } from "../../../../prisma/generated/articles";
import cuid from "cuid";
import { calculateStreak } from "@/lib/dal/notes-stats";
import { getStreakCount } from "@/lib/utils/streak";

interface SubstackNoteComment {
  comment: {
    id: string;
    body: string;
    date: string;
    handle: string;
    name: string;
    photo_url: string;
    reaction_count: number;
    restacks: number;
    attachments?: Attachment[];
    user_id: string;
    userId: string;
    restacked: boolean;
    reactions: any;
    children_count: number;
  };
  isRestacked: boolean;
  entity_key: string;
  type: string;
  contextType: string;
  timestamp: string;
  context?: {
    type: string;
    timestamp: string;
  };
}

interface Attachment {
  id: string;
  noteId: string;
  type: string;
  imageUrl: string;
}

interface ApiResponse {
  items?: Array<{
    type: string;
    entity_key: string;
    comment?: any;
    context: {
      type: string;
      timestamp: string;
    };
  }>;
  nextCursor?: string;
}

export async function fetchAllNoteComments(
  authorId: number,
  options: {
    maxNotes?: number;
    marginOfSafety?: number;
  } = {
    maxNotes: 99999,
    marginOfSafety: 999,
  },
): Promise<{ allNotes: NotesComments[]; newNotes: NotesComments[] }> {
  const { maxNotes = 99999, marginOfSafety = 999 } = options;
  let currentNoNewNotesCount = 0;
  let previousStreakCount = 0;
  let didStreakEnd = false; // If the new streak is the same as the previous streak, it means the user has skipped a day

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
  //   const allUserNotes = await db("notes_comments").where("user_id", authorId);
  const allUserNotes = await prismaArticles.notesComments.findMany({
    where: {
      authorId: authorId,
    },
  });
  let userNewNotes: SubstackNoteComment[] = [];

  if (allUserNotes.length >= maxNotes) {
    return {
      allNotes: allUserNotes,
      newNotes: [],
    };
  }

  const collectedComments: SubstackNoteComment[] = [];
  const initialUrl = `https://substack.com/api/v1/reader/feed/profile/${authorId}`;
  let nextUrl: string | null = initialUrl;
  let prevUrl = "";
  const maxEmptyPages = 10;
  let emptyPages = 0;

  while (nextUrl) {
    if (nextUrl === prevUrl) {
      nextUrl = null;
      continue;
    }
    prevUrl = nextUrl;

    const data: ApiResponse | null = await fetchWithHeaders(nextUrl);

    if (!data) {
      console.log(`No response for ${nextUrl}`);
      nextUrl = null;
      continue;
    }

    if (!data.items || data.items.length === 0) {
      if (data.nextCursor !== "" && !data.nextCursor) {
        break;
      }
      emptyPages++;
      if (emptyPages >= maxEmptyPages || !data.nextCursor) {
        nextUrl = null;
      }
      nextUrl = `${initialUrl}?cursor=${data.nextCursor}`;
      continue;
    }

    emptyPages = 0;
    const noteItems = data.items;
    const comments = noteItems.filter(it => it.type === "comment");

    if (comments.length === 0) {
      if (data.nextCursor !== "" && !data.nextCursor) {
        break;
      }
      emptyPages++;
      console.log(`No comments for ${emptyPages} tries`);
      if (emptyPages >= maxEmptyPages) {
        nextUrl = null;
      }
      nextUrl = `${initialUrl}?cursor=${data.nextCursor}`;
      continue;
    }

    for (const item of comments) {
      const { comment } = item;
      collectedComments.push({
        comment: {
          id: comment.id,
          body: comment.body,
          date: comment.date,
          handle: comment.handle,
          name: comment.name,
          photo_url: comment.photo_url,
          reaction_count: comment.reaction_count,
          restacks: comment.restacks,
          attachments: comment.attachments,
          userId: authorId.toString(),
          user_id: comment.user_id,
          restacked: comment.restacked,
          reactions: comment.reactions,
          children_count: comment.children_count,
        },
        isRestacked: item.context.type === "comment_restack",
        entity_key: item.entity_key,
        type: item.type,
        contextType: item.context.type,
        timestamp: item.context.timestamp,
      });
    }

    // All comments that are not in the user's notes or that are younger than 2 week
    const newComments = comments.filter(
      comment =>
        !allUserNotes
          .map(it => it.commentId)
          .includes(comment.comment?.id?.toString()),
    );

    // If we have the rest of the notes in the db, break.
    if (newComments.length === 0) {
      break;
    }

    // Remove duplicates
    const uniqueComments = newComments.filter(
      (comment, index, self) =>
        index ===
        self.findIndex(t => t.comment?.body === comment.comment?.body),
    );

    // Convert to SubstackNoteComment format before pushing
    const formattedComments = uniqueComments.map(item => ({
      comment: item.comment,
      isRestacked: item.context.type === "comment_restack",
      entity_key: item.entity_key,
      type: item.type,
      contextType: item.context.type,
      timestamp: item.context.timestamp,
    }));

    userNewNotes.push(...formattedComments);

    if (collectedComments.length >= maxNotes) {
      break;
    }

    if (formattedComments.length === 0) {
      currentNoNewNotesCount++;
      console.log(`No new notes for ${currentNoNewNotesCount} tries`);
      if (currentNoNewNotesCount >= marginOfSafety) {
        break;
      }
    } else {
      currentNoNewNotesCount = 0;
      console.log(`New notes found, resetting counter`);
    }

    console.log(`Fetched ${collectedComments.length} notes out of ${maxNotes}`);
    nextUrl = `${initialUrl}?cursor=${data.nextCursor}`;

    const dbNotesTemp: NotesComments[] = collectedComments.map(note => ({
      id: cuid(),
      commentId: note.entity_key,
      type: note.type,
      authorId: parseInt(note.comment.userId),
      body: note.comment.body,
      date: new Date(note.comment.date),
      handle: note.comment.handle,
      name: note.comment.name,
      photoUrl: note.comment.photo_url,
      reactionCount: note.comment.reaction_count,
      reactions: note.comment.reactions,
      commentsCount: note.comment.children_count,
      restacks: note.comment.restacks,
      restacked: note.isRestacked,
      timestamp: new Date(note.timestamp),
      contextType: note.contextType,
      entityKey: note.entity_key,
      noteIsRestacked: note.isRestacked,
    }));

    const earliestNote = dbNotesTemp.sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )[0];

    const streak = calculateStreak(dbNotesTemp);
    const streakCount = getStreakCount(streak);
    if (streakCount > previousStreakCount) {
      didStreakEnd = false;
    } else {
      didStreakEnd = true;
    }
    previousStreakCount = streakCount;

    if (earliestNote?.date < sixMonthsAgo && didStreakEnd) {
      break;
    }
  }

  console.log("Collected comments", collectedComments.length);

  const dbNotes: NotesComments[] = collectedComments.map(note => ({
    id: cuid(),
    commentId: note.entity_key,
    type: note.type,
    authorId: parseInt(note.comment.userId),
    body: note.comment.body,
    date: new Date(note.comment.date),
    handle: note.comment.handle,
    name: note.comment.name,
    photoUrl: note.comment.photo_url,
    reactionCount: note.comment.reaction_count,
    reactions: note.comment.reactions,
    commentsCount: note.comment.children_count,
    restacks: note.comment.restacks,
    restacked: note.isRestacked,
    timestamp: new Date(note.timestamp),
    contextType: note.contextType,
    entityKey: note.entity_key,
    noteIsRestacked: note.isRestacked,
  }));

  const newDbNotes = userNewNotes.map(note => ({
    id: cuid(),
    commentId: note.entity_key,
    type: note.type,
    authorId: parseInt(note.comment.userId),
    body: note.comment.body,
    date: new Date(note.comment.date),
    handle: note.comment.handle,
    name: note.comment.name,
    photoUrl: note.comment.photo_url,
    reactionCount: note.comment.reaction_count,
    reactions: note.comment.reactions,
    commentsCount: note.comment.children_count,
    restacks: note.comment.restacks,
    restacked: note.isRestacked,
    timestamp: new Date(note.timestamp),
    contextType: note.contextType,
    entityKey: note.entity_key,
    noteIsRestacked: note.isRestacked,
  }));

  const allUserDbNotes = [...allUserNotes, ...dbNotes, ...newDbNotes];

  const uniqueAllUserDbNotes = Array.from(
    new Map(
      allUserDbNotes.map(it => [`${it.commentId}-${it.date}`, it]),
    ).values(),
  );

  return {
    allNotes: uniqueAllUserDbNotes,
    newNotes: newDbNotes,
  };
}
