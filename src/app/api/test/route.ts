import prisma from "@/app/api/_db/db";
import { NextResponse } from "next/server";

export async function GET() {
  const allUserMetadata = await prisma.userMetadata.findMany();
  await prisma.userMetadata.updateMany({
    data: {
      plan: null,
    },
  });
  const allUserMetadataNew = await prisma.userMetadata.findMany();
  return NextResponse.json({ message: "Updated" });
}
