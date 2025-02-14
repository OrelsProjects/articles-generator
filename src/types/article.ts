import { Post } from "../../prisma/generated/articles";

export type ArticleAudienceType = "paid_only" | "everyone";

export type Article = Omit<Post, "canonicalUrl" | "publication_id_bigint"> & {
  canonicalUrl: string;
};
export type ArticleWithBody = Omit<
  Post,
  "canonicalUrl" | "publication_id_bigint"
> & {
  canonicalUrl: string;
  bodyText: string;
};
