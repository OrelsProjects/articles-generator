import { Idea as PrismaIdea } from "@prisma/client";

export type Idea = Omit<PrismaIdea, "createdAt" | "publicationId" | "userId">;

export const EmptyIdea: any = (userId: string, publicationId: string) => ({
  id: "temp-id",
  userId,
  publicationId,
  topic: "",
  title: "",
  subtitle: "",
  description: "",
  outline: "",
  inspiration: "",
  image: "",
  search: false,
  didUserSee: false,
  body: "",
  bodyHistory: [],
  status: "new",
  isFavorite: false,
  modelUsedForIdeas: "",
  modelUsedForOutline: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});
