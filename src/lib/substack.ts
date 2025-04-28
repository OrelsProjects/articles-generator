import { prisma } from "@/app/api/_db/db";
import { downloadImage } from "@/lib/files-note";
import { UploadImageParams } from "@/types/files-notes.type";
import { NoteDraftImage, SubstackImageResponse } from "@/types/note";
import { CookieName } from "@prisma/client";

export class NoteNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoteNotFoundError";
  }
}

export class FailedToUploadImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FailedToUploadImageError";
  }
}

export async function uploadImageSubstack(
  image: Buffer | string,
  params: {
    userId: string;
    noteId: string;
    s3AttachmentId: string;
  },
): Promise<NoteDraftImage> {
  const base64 = image.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const cookie = await prisma.substackCookie.findUnique({
    where: {
      name_userId: {
        name: CookieName.substackSid,
        userId: params.userId,
      },
    },
  });

  const note = await prisma.note.findUnique({
    where: {
      id: params.noteId,
    },
  });

  if (!note) {
    throw new NoteNotFoundError("Note not found");
  }

  const uploadImageRespone = await fetch("https://substack.com/api/v1/image", {
    headers: {
      "Content-Type": "application/json",
      Referer: "https://substack.com/home",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      Cookie: `substack.sid=${cookie?.value}`,
    },
    body: JSON.stringify({ image: dataUri }),
    method: "POST",
  });

  if (!uploadImageRespone.ok) {
    throw new FailedToUploadImageError("Failed to upload image");
  }

  const data = await uploadImageRespone.json();

  // payload: {type: "image", url: `${url}`}
  const getImageResponse = await fetch(
    "https://substack.com/api/v1/comment/attachment",
    {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://substack.com/home",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        Cookie: `substack.sid=${cookie?.value}`,
      },
      method: "POST",
      body: JSON.stringify({ type: "image", url: data.url }),
    },
  );

  if (!getImageResponse.ok) {
    throw new FailedToUploadImageError("Failed to upload image");
  }

  const imageData: SubstackImageResponse = await getImageResponse.json();

  const substackImage = await prisma.substackImage.create({
    data: {
      noteId: params.noteId,
      imageId: imageData.id,
      imageUrl: imageData.imageUrl,
      imageWidth: imageData.imageWidth,
      imageHeight: imageData.imageHeight,
      explicit: imageData.explicit,
      s3AttachmentId: params.s3AttachmentId,
    },
  });

  const response: NoteDraftImage = {
    id: substackImage.imageId,
    url: substackImage.imageUrl,
  };

  return response;
}

/**
 * Uploads images to substack and returns the NoteDraftImage[]
 */
export async function prepareAttachmentsForNote(
  noteId: string,
): Promise<NoteDraftImage[]> {
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
    include: {
      S3Attachment: true,
    },
  });

  if (!note) {
    throw new NoteNotFoundError("Note not found");
  }

  let attachments: NoteDraftImage[] = [];

  for (const attachment of note.S3Attachment) {
    const buffer = await downloadImage({
      s3Url: attachment.s3Url,
    });
    const substackImage = await uploadImageSubstack(buffer, {
      userId: note.userId,
      noteId: noteId,
      s3AttachmentId: attachment.id,
    });
    attachments.push(substackImage);
  }

  return attachments;
}
