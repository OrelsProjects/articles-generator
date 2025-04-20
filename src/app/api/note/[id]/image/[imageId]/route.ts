import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isOwnerOfNote } from "@/lib/dal/note";
import { deleteImage } from "@/lib/files-note";
import { prepareAttachmentsForNote } from "@/lib/substack";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { imageId: string; id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const substackImage = await prisma.substackImage.findFirst({
      where: {
        s3AttachmentId: params.imageId,
      },
    });

    const attachmentIds: string[] = [];

    if (!substackImage) {
      const prepareAttachment = await prepareAttachmentsForNote(params.id);
      attachmentIds.push(...prepareAttachment.map(a => a.id));
    } else {
      attachmentIds.push(substackImage.imageId);
    }
    return NextResponse.json(
      {
        attachmentIds,
      },
      {
        status: 200,
      },
    );
  } catch (err: any) {
    loggerServer.error("Error getting substack image: " + err);
    return NextResponse.json(JSON.stringify({ error: "Failed to get image" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const isOwner = await isOwnerOfNote(params.id, session.user.id);
    if (!isOwner) {
      return NextResponse.json(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const s3Attachment = await prisma.s3Attachment.findUnique({
      where: {
        id: params.imageId,
      },
    });

    if (!s3Attachment) {
      return NextResponse.json(JSON.stringify({ error: "Image not found" }), {
        status: 404,
      });
    }

    await deleteImage({
      fileName: s3Attachment.fileName,
      noteId: params.id,
      userName: session.user.name || session.user.email || session.user.id,
    });

    await prisma.s3Attachment.delete({
      where: {
        id: params.imageId,
      },
    });

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      JSON.stringify({ error: "Failed to delete image" }),
      { status: 500 },
    );
  }
}
