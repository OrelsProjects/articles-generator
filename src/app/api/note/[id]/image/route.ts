import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isOwnerOfNote } from "@/lib/dal/note";
import { uploadImage } from "@/lib/files-note";
import loggerServer from "@/loggerServer";
import { NoteDraftImage, SubstackImageResponse } from "@/types/note";
import { CookieName } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// export async function POST(
//   req: NextRequest,
//   {
//     params,
//   }: {
//     params: {
//       id: string;
//     };
//   },
// ) {
//   const session = await getServerSession(authOptions);
//   if (!session) {
//     return NextResponse.json(JSON.stringify({ error: "Unauthorized" }), {
//       status: 401,
//     });
//   }

//   try {
//     const arrayBuffer = await req.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     const base64 = buffer.toString("base64");
//     const dataUri = `data:image/png;base64,${base64}`;

//     const cookie = await prisma.substackCookie.findUnique({
//       where: {
//         name_userId: {
//           name: CookieName.substackSid,
//           userId: session.user.id,
//         },
//       },
//     });

//     const note = await prisma.note.findUnique({
//       where: {
//         id: params.id,
//       },
//     });

//     if (!note) {
//       return NextResponse.json(JSON.stringify({ error: "Note not found" }), {
//         status: 404,
//       });
//     }

//     const uploadImageRespone = await fetch(
//       "https://substack.com/api/v1/image",
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Referer: "https://substack.com/home",
//           "Referrer-Policy": "strict-origin-when-cross-origin",
//           Cookie: `substack.sid=${cookie?.value}`,
//         },
//         body: JSON.stringify({ image: dataUri }),
//         method: "POST",
//       },
//     );

//     if (!uploadImageRespone.ok) {
//       return NextResponse.json(
//         JSON.stringify({ error: "Failed to upload image" }),
//         {
//           status: 500,
//         },
//       );
//     }

//     const data = await uploadImageRespone.json();

//     // payload: {type: "image", url: `${url}`}
//     const getImageResponse = await fetch(
//       "https://substack.com/api/v1/comment/attachment",
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Referer: "https://substack.com/home",
//           "Referrer-Policy": "strict-origin-when-cross-origin",
//           Cookie: `substack.sid=${cookie?.value}`,
//         },
//         method: "POST",
//         body: JSON.stringify({ type: "image", url: data.url }),
//       },
//     );

//     if (!getImageResponse.ok) {
//       return NextResponse.json(
//         JSON.stringify({ error: "Failed to upload image" }),
//         {
//           status: 500,
//         },
//       );
//     }

//     const imageData: SubstackImageResponse = await getImageResponse.json();

//     const substackImage = await prisma.substackImage.create({
//       data: {
//         noteId: params.id,
//         imageId: imageData.id,
//         imageUrl: imageData.imageUrl,
//         imageWidth: imageData.imageWidth,
//         imageHeight: imageData.imageHeight,
//         explicit: imageData.explicit,
//       },
//     });

//     const response: NoteDraftImage = {
//       id: substackImage.id,
//       url: substackImage.imageUrl,
//       width: substackImage.imageWidth,
//       height: substackImage.imageHeight,
//     };

//     return NextResponse.json(response, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (err) {
//     console.error("Error converting image:", err);
//     return NextResponse.json(
//       JSON.stringify({ error: "Failed to convert image" }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     );
//   }
// }

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

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json(JSON.stringify({ error: "Note not found" }), {
        status: 404,
      });
    }

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
    loggerServer.error("Error uploading image: " + JSON.stringify(error));
    return NextResponse.json(
      JSON.stringify({ error: "Failed to upload image" }),
      {
        status: 500,
      },
    );
  }
}
