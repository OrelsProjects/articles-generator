import {
  NotesAttachments,
  NotesComments,
} from "../../prisma/generated/articles";


export interface ExtensionResponseAttachment {
  id: string;
  comment_id: string;
  attachment_id: string;
  type: string;
  image_url: string;
}

export interface ExtensionResponseComment {
  id: string;
  comment_id: string;
  type: string;
  author_id: string;
  body: string;
  body_json: any;
  date: string;
  handle: string;
  name: string;
  photo_url: string;
  reaction_count: number;
  restacks: number;
  restacked: boolean;
  timestamp: string;
  context_type: string;
  entity_key: string;
  note_is_restacked: boolean;
  reactions: any;
  children_count: number;
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

    try {
      const dbNote: NotesComments = {
        id: note.id,
        entityKey: note.entity_key,
        type: note.type,
        timestamp: new Date(note.timestamp),
        contextType: note.context_type,
        noteIsRestacked: note.note_is_restacked,
        authorId: parseInt(note.author_id.toString()),
        commentId: note.comment_id.toString(),
        date: new Date(note.date),
        handle: note.handle,
        name: note.name,
        photoUrl: note.photo_url,
        reactionCount: note.reaction_count,
        reactions: note.reactions ? JSON.stringify(note.reactions) : null,
        commentsCount: note.children_count || 0,
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
            noteId: parseInt(note.comment_id),
            attachmentId: attachment.attachment_id,
            type: attachment.type,
            imageUrl: attachment.image_url,
          };
          attachmentsDb.push(dbAttachment);
        }
      }
      notes.push({ note: dbNote, attachments: attachmentsDb });
    } catch (error) {
      console.error("Error parsing note", error);
    }
  }

  return notes;
}
