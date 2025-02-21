import { Idea } from "@/types/idea";

export interface Publication {
  id: string;
  image: string | null;
  title: string | null;
  description: string | null;
  url: string;
}

export interface PublicationResponse {
  id?: string | null;
  image: string | null;
  title: string | null;
  description: string | null;
  ideas: Omit<Idea, "didUserSee">[];
  url: string;
}
