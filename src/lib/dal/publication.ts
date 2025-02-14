import { prismaArticles } from "@/app/api/_db/db";
import { Publication } from "../../../prisma/generated/articles";
import { stripUrl } from "@/lib/utils/url";
import { extractContent } from "@/app/api/user/analyze/_utils";

export const getPublicationByUrl = async (
  url: string,
): Promise<Publication[]> => {
  const strippedUrl = stripUrl(url, { removeWww: true, removeDotCom: true });

  let publications = await prismaArticles.publication.findMany({
    where: {
      OR: [
        {
          customDomain: {
            contains: strippedUrl,
          },
        },
        {
          subdomain: {
            contains: strippedUrl,
          },
        },  
      ],
    },
  });

  if (publications.length === 0) {
    const { image, title, description } = await extractContent(url);
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
