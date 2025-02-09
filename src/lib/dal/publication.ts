import { prismaArticles } from "@/app/api/_db/db";
import { Publication } from "../../../prisma/generated/articles";
import { stripUrl } from "@/lib/utils/url";

export const getPublicationByUrl = async (
  url: string,
): Promise<Publication[]> => {
  const strippedUrl = stripUrl(url);
  const publications = await prismaArticles.$queryRaw`
  SELECT id::int, author_id::int, * FROM "publications"
  WHERE "subdomain" % ${strippedUrl}
  ORDER BY similarity("subdomain", ${strippedUrl}) DESC
  LIMIT 10;
`;

  return publications as Publication[];
};
