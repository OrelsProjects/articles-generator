import {
  NotesAttachments,
  NotesComments,
} from "../../prisma/generated/articles";

interface ExtensionResponseComment {
  id: string;
  authorId: number;
  commentId: string;
  type: string;
  body: string;
  bodyJson: any;
  date: string;
  handle: string;
  name: string;
  photoUrl: string;
  reactionCount: number;
  restacks: number;
  restacked: boolean;
  timestamp: string;
  contextType: string;
  entityKey: string;
  noteIsRestacked: boolean;
  reactions: any;
  childrenCount: number;
}

interface ExtensionResponseAttachment {
  id: string;
  commentId: string;
  attachmentId: string;
  type: string;
  imageUrl: string;
}

export interface ExtensionResponseNoteComment {
  note: ExtensionResponseComment | null;
  attachments: ExtensionResponseAttachment[] | null;
}

export function parseToDb(comments: ExtensionResponseNoteComment[]): {
  note: NotesComments;
  attachments: NotesAttachments[];
}[] {
  let notes: { note: NotesComments; attachments: NotesAttachments[] }[] = [];

  for (const { note, attachments } of comments) {
    if (!note) continue;

    const dbNote: NotesComments = {
      id: note.id,
      entityKey: note.entityKey,
      type: note.type,
      timestamp: new Date(note.timestamp),
      contextType: note.contextType,
      noteIsRestacked: note.noteIsRestacked,
      authorId: parseInt(note.authorId.toString()),
      commentId: note.commentId.toString(),
      date: new Date(note.date),
      handle: note.handle,
      name: note.name,
      photoUrl: note.photoUrl,
      reactionCount: note.reactionCount,
      reactions: note.reactions ? JSON.stringify(note.reactions) : null,
      commentsCount: note.childrenCount || 0,
      restacks: note.restacks,
      restacked: note.restacked,
      body: note.body,
    };

    let attachmentsDb: NotesAttachments[] = [];
    if (attachments) {
      for (const attachment of attachments) {
        if (!attachment) continue;

        const dbAttachment: NotesAttachments = {
          id: attachment.id,
          noteId: parseInt(note.commentId),
          attachmentId: attachment.attachmentId,
          type: attachment.type,
          imageUrl: attachment.imageUrl,
        };
        attachmentsDb.push(dbAttachment);
      }
    }
    notes.push({ note: dbNote, attachments: attachmentsDb });
  }

  return notes;
}
