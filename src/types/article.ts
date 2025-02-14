import { Post } from "../../prisma/generated/articles";

export type ArticleAudienceType = "paid_only" | "everyone";

export type Article = Omit<Post, "canonicalUrl"> & {
  canonicalUrl: string;
};
export type ArticleWithBody = Omit<
  Post,
  "canonicalUrl"
> & {
  canonicalUrl: string;
  bodyText: string;
};
