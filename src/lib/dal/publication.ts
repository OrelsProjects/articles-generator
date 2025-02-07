import { prismaArticles } from "@/app/api/_db/db";
import { Publication } from "../../../prisma/generated/articles";

export const getPublicationByUrl = async (
  url: string,
): Promise<Publication[]> => {
const publications = await prismaArticles.$queryRaw`
  SELECT id::int, author_id::int, * FROM "publications"
  WHERE "subdomain" % ${url}
  ORDER BY similarity("subdomain", ${url}) DESC
  LIMIT 10;
`;

  return publications as Publication[];
};
