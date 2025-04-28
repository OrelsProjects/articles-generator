// /lib/prisma.ts

import { PrismaClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "@/../prisma/generated/articles";

// Make TypeScript happy about globalThis
declare global {
  var prisma: PrismaClient | undefined;
  var prismaArticles: PostgresClient | undefined;
}

// Make a SINGLE PrismaClient instance, or re-use existing
export const prisma = globalThis.prisma ?? new PrismaClient();
export const prismaArticles = globalThis.prismaArticles ?? new PostgresClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
  globalThis.prismaArticles = prismaArticles;
}
