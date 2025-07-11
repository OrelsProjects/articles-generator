// /lib/prisma.ts

import { PrismaClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "@/../prisma/generated/articles";
import loggerServer from "@/loggerServer";

// Make TypeScript happy about globalThis
declare global {
  var prisma: PrismaClient | undefined;
  var prismaArticles: PostgresClient | undefined;
  var prismaProd: PrismaClient | undefined;
}

// Make a SINGLE PrismaClient instance, or re-use existing
export const prisma =
  globalThis.prisma ??
  (() => {
    return new PrismaClient();
  })();
export const prismaArticles = globalThis.prismaArticles ?? new PostgresClient();

export const prismaProd =
  globalThis.prismaProd ??
  (() => {
    return new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL_PROD,
    });
  })();

globalThis.prisma = prisma;
globalThis.prismaArticles = prismaArticles;
globalThis.prismaProd = prismaProd;
