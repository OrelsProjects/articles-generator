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

  // const users = await prisma.user.findMany();
  // const subscriptions = await prisma.subscription.findMany();
  // const userSubscriptions = users
  //   .map(user => {
  //     const subscription = subscriptions.find(
  //       subscription => subscription.userId === user.id,
  //     );
  //     return { ...user, subscription };
  //   })
  //   .filter(user => user.subscription && user.email && user.name);

  // const emailsSeparatedByComma = userSubscriptions
  //   .map(user => {
  //     return user.email;
  //   })
  //   .join(",");

  // for (const user of userSubscriptions) {
  //   await addUserToList({
  //     email: user.email!,
  //     fullName: user.name!,
  //   });
  // }

  // await sendFeaturesMailToList();

  return NextResponse.json({ message: "success" });
}
