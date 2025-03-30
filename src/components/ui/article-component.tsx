import { Article } from "@/types/article";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ArticleComponentProps {
  article: Article;
}

export default function ArticleComponent({ article }: ArticleComponentProps) {
  return (
    <div className="flex flex-col relative rounded-xl shadow-md border border-border/60 bg-card p-4">
      <Link href={article.canonicalUrl} target="_blank">
        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
          {article.title}
        </h3>
      </Link>
      <p className="mt-2 text-gray-600 line-clamp-2">{article.description}</p>
      <div className="mt-4 flex items-center justify-between text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-muted-foreground flex items-center text-red-500">
            <Heart className="h-4 w-4 mr-1 text-red-500 fill-red-500" />
            {article.reactionCount}
          </span>
          <span className="text-xs text-muted-foreground flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {article.commentCount}
          </span>
        </div>
      </div>
    </div>
  );
}
