import prisma from "@/app/api/_db/db";
import { NextRequest, NextResponse } from "next/server";

const TOP_CREATORS_IDS = [
  "67d7cff659df3cb90c4e6a77",
  "67d6c94b7117ac1b45daec65",
  "67d558b5bca90cfca3f6882d",
  "67bed548bc86e946a0f2cbee",
  "67b0cf07cf43e8e5048d971f",
  "67acdd0d46da31aa52b4996f",
];
export async function GET(req: NextRequest) {
  try {
    const topCreators = await prisma.note.findMany({
      where: {
        userId: {
          in: TOP_CREATORS_IDS,
        },
      },
    });

    const topCreatorsImages = topCreators.map(creator => {
      const thumbnail = creator.thumbnail || "";
      const name = creator.name || "";
      return { thumbnail, name };
    });
    // only unique thumbnails
    const uniqueTopCreatorsImages = Array.from(new Set(topCreatorsImages));

    return NextResponse.json({
      topCreatorsImages: uniqueTopCreatorsImages,
    });
  } catch (error) {
    return NextResponse.json({
      error: error,
    });
  }
}
