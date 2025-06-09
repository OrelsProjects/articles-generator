import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { uploadImage } from "@/lib/files-note";
import loggerServer from "@/loggerServer";
import { NoteDraftImage } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE } from "@/lib/consts";
import { AttachmentType } from "@prisma/client";
import { getOg } from "@/lib/dal/og";

// In-memory store for chunks
const chunksMap = new Map<
  string,
  {
    chunks: (Buffer | null)[];
    totalChunks: number;
    fileName: string;
    mimeType: string;
  }
>();

async function cleanupChunks(fileId: string) {
  chunksMap.delete(fileId);
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const noteId = params.id;
    loggerServer.info("Uploading image chunk", {
      userId: session.user.id,
      noteId,
    });

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      loggerServer.warn("Note not found for upload", {
        userId: session.user.id,
        noteId,
      });
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const form = await req.formData();
    const type = form.get("type") as AttachmentType;
    if (type === AttachmentType.link) {
      const url = form.get("url") as string;
      const ogData = await getOg(url);
      if (!ogData) {
        loggerServer.error("Failed to get OG data to upload link", {
          userId: session.user.id,
          noteId,
          url,
        });
        return NextResponse.json(
          { error: "Failed to get OG data" },
          { status: 500 },
        );
      }
      const og = ogData;
      const attachment = await prisma.s3Attachment.create({
        data: {
          noteId,
          s3Url: url,
          fileName: url,
          type,
        },
      });
      return NextResponse.json({ og, attachment }, { status: 200 });
    }
    const file = form.get("file") as File;
    const fileId = form.get("fileId") as string;
    const chunkIndex = parseInt(form.get("chunkIndex") as string, 10);
    const totalChunks = parseInt(form.get("totalChunks") as string, 10);
    const fileName = form.get("fileName") as string;
    const mimeType = form.get("mimeType") as string;

    if (!file || !fileId) {
      throw new Error("Missing file or fileId");
    }

    // If file size is bigger than MAX_FILE_SIZE, return 413
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Read chunk
    const buffer = Buffer.from(await file.arrayBuffer());

    // Initialize storage if first chunk
    if (!chunksMap.has(fileId)) {
      chunksMap.set(fileId, {
        chunks: Array(totalChunks).fill(null),
        totalChunks,
        fileName,
        mimeType,
      });
    }

    const fileData = chunksMap.get(fileId)!;
    fileData.chunks[chunkIndex] = buffer;

    // Check completeness
    const allReceived = fileData.chunks.every(c => c !== null);
    if (!allReceived) {
      return NextResponse.json({ status: "chunk_received" }, { status: 200 });
    }

    // Concatenate
    const completeBuffer = Buffer.concat(fileData.chunks as Buffer[]);

    // Upload
    const imageUrl = await uploadImage(completeBuffer, {
      noteId,
      fileName: fileData.fileName,
      userName: session.user.name || session.user.email || session.user.id,
    });

    loggerServer.info("Image uploaded to S3", {
      userId: session.user.id,
      noteId,
      url: imageUrl.url,
    });

    const s3Attachment = await prisma.s3Attachment.create({
      data: {
        noteId,
        s3Url: imageUrl.url,
        fileName: imageUrl.fileName,
      },
    });

    // Cleanup
    await cleanupChunks(fileId);

    const response: NoteDraftImage = {
      id: s3Attachment.id,
      url: s3Attachment.s3Url,
      type: s3Attachment.type,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    loggerServer.error("Upload error", {
      userId: session?.user.id,
      error: err?.message || err,
    });
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
