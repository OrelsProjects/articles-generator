import { Idea } from "@/types/idea";

export interface Publication {
  id: string;
  image: string | null;
  title: string | null;
  description: string | null;
}

export interface PublicationResponse {
  publicationId: string;
  image: string | null;
  title: string | null;
  description: string | null;
  ideas: Idea[];
}
