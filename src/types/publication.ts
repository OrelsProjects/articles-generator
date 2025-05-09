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


export interface BylineResponse {
  publicationUsers: {
    publication: PublicationDB;
  }[];
}

export interface PublicationDB {
  id: number;
  name: string;
  subdomain: string;
  custom_domain: string;
  custom_domain_optional: boolean;
  hero_text: string;
  logo_url: string;
  email_from_name: string | null;
  copyright: string;
  author_id: number;
  created_at: string;
  language: string;
  explicit: boolean;
}

export interface PublicationDataResponse {
  newPosts: {
    id: number;
    publication_id: number;
    title: string;
    social_title: string;
    search_engine_title: string;
    search_engine_description: string;
    slug: string;
    publishedBylines: BylineResponse[];
  }[];
}