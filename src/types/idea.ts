import { Idea as PrismaIdea } from "@prisma/client";

export type Idea = Omit<PrismaIdea, "createdAt" | "publicationId" | "userId">;
