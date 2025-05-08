import { Post } from "../../prisma/generated/articles";

export type ArticleAudienceType = "paid_only" | "everyone";

export type Article = Omit<Post, "canonicalUrl"> & {
  canonicalUrl: string;
};

export type ArticleWithBody = Omit<Post, "canonicalUrl"> & {
  canonicalUrl: string;
  bodyText: string;
};

export interface Byline {
  authorId: number;
  handle: string;
  name: string;
  photoUrl: string;
  bio: string;
}

export interface BylineWithExtras extends Byline {
  isFollowing: boolean;
  isSubscribed: boolean;
  bestsellerTier: number;
  subscriberCount: number;
  subscriberCountString: string;
  score: number;
}

export interface DescriptionObject {
  about: string;
  aboutGeneral: string;
  writingStyle: string;
  topics: string;
  personality: string;
  specialEvents: string;
  privateLife: string;
  highlights: string;
}
