import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import cuid from "cuid";
import { deleteFile, uploadFile } from "@/lib/files-article";

export async function POST(
  req: NextRequest,
  params: {
    params: { ideaId: string };
  },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let imageId = "";
  let extension = "";
  let publicationName = "";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const isFileImage = file.type.startsWith("image/");

    if (!isFileImage) {
      return NextResponse.json(
        { error: "File is not an image" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = await prisma.image.create({
      data: {
        url: `temporary-url-${cuid()}`,
        ideaId: params.params.ideaId,
      },
    });

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        publication: true,
      },
    });

    if (!userMetadata || !userMetadata.publication) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 400 },
      );
    }

    imageId = image.id;
    extension = file.type.split("/")[1];
    publicationName =
      userMetadata.publication.title || userMetadata.publication.id;

    const url = await uploadFile(buffer, {
      publicationName,
      id: image.id,
      extension,
    });

    await prisma.image.update({
      where: { id: imageId },
      data: { url },
    });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error uploading file:", {
      error,
      userId: session.user.id,
    });
    if (imageId) {
      await prisma.image.delete({
        where: { id: imageId },
      });
      await deleteFile({
        publicationName,
        id: imageId,
        extension,
      });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
