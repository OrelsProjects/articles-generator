import { Idea } from "@/types/idea";

export interface Publication {
  id: string;
  image: string | null;
  title: string | null;
  description: string | null;
  url: string;
  preferredTopics?: string[];
  personalDescription?: string | null;
  userSettingsUpdatedAt?: Date | null;
}

export interface PublicationResponse {
  id?: string | null;
  image: string | null;
  title: string | null;
  description: string | null;
  ideas: Omit<Idea, "didUserSee">[];
  url: string;
  preferredTopics?: string[];
  personalDescription?: string | null;
  userSettingsUpdatedAt?: Date | null;
  generatedDescription?: string | null;
  generatedTopics?: string | null;
}
