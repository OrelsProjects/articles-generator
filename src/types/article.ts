import { Post } from "../../prisma/generated/articles";

export type ArticleAudienceType = "paid_only" | "everyone";

export type Article = Post;
export type ArticleWithBody = Post;
