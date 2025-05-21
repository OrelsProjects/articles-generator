import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { uploadImage } from "@/lib/files-note";
import loggerServer from "@/loggerServer";
import { NoteDraftImage } from "@/types/note";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE } from "@/lib/consts";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: MAX_FILE_SIZE,
    },
  },
};

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { id } = params;
    loggerServer.info("Uploading image to note", {
      userId: session?.user.id,
      noteId: id,
    });

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      loggerServer.warn("Note not found when uploading image", {
        userId: session?.user.id,
        noteId: id,
      });
      return NextResponse.json(JSON.stringify({ error: "Note not found" }), {
        status: 404,
      });
    }

    loggerServer.info("Uploading image to note", {
      userId: session?.user.id,
      noteId: id,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadImage(buffer, {
      noteId: id,
      fileName,
      userName: session.user.name || session.user.email || session.user.id,
    });

    loggerServer.info("Image uploaded to S3", {
      userId: session?.user.id,
      noteId: id,
      imageUrl,
    });

    const s3Attachment = await prisma.s3Attachment.create({
      data: {
        noteId: id,
        s3Url: imageUrl.url,
        fileName: imageUrl.fileName,
      },
    });

    const response: NoteDraftImage = {
      id: s3Attachment.id,
      url: s3Attachment.s3Url,
    };

    return NextResponse.json(response, {
      status: 200,
    });
  } catch (error: any) {
    loggerServer.error("Error uploading image: " + JSON.stringify(error), {
      userId: session?.user.id,
      error,
    });
    return NextResponse.json(
      JSON.stringify({ error: "Failed to upload image" }),
      {
        status: 500,
      },
    );
  }
}
