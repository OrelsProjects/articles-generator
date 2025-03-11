import prisma from "@/app/api/_db/db";
import { getAuthorId } from "@/lib/dal/publication";
import { NextResponse } from "next/server";

export async function GET() {
  // let userMetdata = await prisma.userMetadata.findMany({
  //   include: {
  //     publication: true,
  //   },
  // });

  // const publications = await prisma.publicationMetadata.findMany();
  // const publicationsWithoutAuthorId = publications.filter(
  //   publication => !publication.authorId,
  // );

  // const userMetadataWithoutPublication = userMetdata.filter(metadata =>
  //   publicationsWithoutAuthorId.find(
  //     publication => publication.id === metadata.publicationId,
  //   ),
  // );

  // // userMetdata = userMetdata.filter(metadata => metadata.publication);
  // for (const metadata of userMetadataWithoutPublication) {
  //   const authorId = await getAuthorId(metadata.userId);
  //   if (authorId) {
  //     await prisma.publicationMetadata.update({
  //       where: { id: metadata.publication!.id },
  //       data: { authorId },
  //     });
  //   }
  // }

  return NextResponse.json({ message: "Updated" });
}
