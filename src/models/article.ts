import { Post } from "../../prisma/generated/articles";

export type Article = Post;
export type ArticleWithBody = Post & { body_text: string };