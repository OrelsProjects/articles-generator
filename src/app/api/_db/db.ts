import { PrismaClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "@/../prisma/generated/articles";

const prisma = new PrismaClient();
export const prismaArticles = new PostgresClient();

export default prisma;
