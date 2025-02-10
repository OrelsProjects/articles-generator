import { prismaArticles } from "@/app/api/_db/db";
import { Publication } from "../../../prisma/generated/articles";
import { stripUrl } from "@/lib/utils/url";
import { extractContent } from "@/app/api/user/analyze/_utils";

export const getPublicationByUrl = async (
  url: string,
): Promise<Publication[]> => {
  const strippedUrl = stripUrl(url, { removeWww: true, removeDotCom: true });
  //   const publications = await prismaArticles.$queryRaw`
  //   SELECT id::int, author_id::int, * FROM "publications"
  //   WHERE "subdomain" % ${strippedUrl}
  //   ORDER BY similarity("subdomain", ${strippedUrl}) DESC
  //   LIMIT 10;
  // `;

  let publications = await prismaArticles.publication.findMany({
    where: {
      customDomain: {
        contains: strippedUrl,
      },
    },
  });

  if (publications.length === 0) {
    const { image, title } = await extractContent(url);
    publications = await prismaArticles.publication.findMany({
      where: {
        OR: [
          {
            logoUrl: {
              contains: image,
            },
          },
          {
            name: title,
          },
        ],
      },
    });
  }

  return publications as Publication[];
};
