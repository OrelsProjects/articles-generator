import { IdeaStatus } from "@prisma/client";

export interface Idea {
  id: string;
  topic?: string | null;
  title: string;
  subtitle: string;
  outline: string;
  description: string;
  inspiration: string;

  status: IdeaStatus;
  isFavorite: boolean;

  modelUsedForIdeas?: string;
  modelUsedForOutline?: string;

  updatedAt: Date;
}
