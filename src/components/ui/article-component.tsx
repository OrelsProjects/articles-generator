import { Article } from "@/types/article";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ArticleComponentProps {
  article: Article;
  className?: string;
}

export default function ArticleComponent({
  article,
  className,
}: ArticleComponentProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-background overflow-hidden transition-all hover:shadow-lg",
        className,
      )}
    >
      <Link
        href={article.canonicalUrl}
        target="_blank"
        className="flex flex-col flex-1"
      >
        <div className="relative h-48 w-full overflow-hidden">
          {article.coverImage && (
            <img
              src={article.coverImage}
              alt={article.title || "Article cover"}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/0  via-background/30 hover:via-background/5 transition-all duration-200" />
        </div>
        <div className="flex flex-col flex-1 p-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {article.description}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1.5 text-red-500" />
                {article.reactionCount}
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                {article.commentCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
