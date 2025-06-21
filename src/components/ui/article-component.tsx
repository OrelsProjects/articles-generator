import { Article } from "@/types/article";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ArticleComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  article: Article;
  className?: string;
  size?: "default" | "small" | "large" | "xs";
  onClick?: () => void;
  disabled?: boolean;
  hoverLayout?: () => React.ReactNode;
  showShadowHover?: boolean;
  hideGlare?: boolean;
}

export default function ArticleComponent({
  article,
  className,
  size = "default",
  onClick,
  disabled = false,
  hoverLayout,
  showShadowHover = true,
  hideGlare = false,
  ...props
}: ArticleComponentProps) {
  return (
    <div
      className={cn(
        "h-full group relative flex flex-col rounded-xl border bg-background overflow-hidden transition-all hover:shadow-lg",
        size === "small" && "max-w-[200px] md:max-w-[250px]",
        size === "large" && "max-w-none",
        size === "xs" && "max-w-[200px] md:max-w-[200px]",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {hoverLayout && hoverLayout()}
      <Link
        href={article.canonicalUrl}
        target="_blank"
        className="flex flex-col flex-1"
        onClick={e => {
          if (disabled) {
            e.preventDefault();
          } else {
            onClick && e.preventDefault();
          }
        }}
      >
        <div
          className={cn(
            "relative h-48 w-full overflow-hidden",
            size === "small" && "h-16 md:h-24",
            size === "xs" && "h-16 md:h-20",
            size === "large" && "h-64",
          )}
        >
          {article.coverImage && (
            <img
              src={article.coverImage}
              alt={article.title || "Article cover"}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          )}
          {showShadowHover && (
            <div className="absolute inset-0 bg-gradient-to-t from-background to-background/0  via-background/30 hover:via-background/5 transition-all duration-200" />
          )}
        </div>
        <div
          className={cn("flex flex-col flex-1 p-4", size === "small" && "p-2")}
        >
          <div className="flex-1">
            <h3
              className={cn(
                "font-semibold text-foreground group-hover:text-primary transition-colors",
                size === "default" && "text-lg",
                size === "small" && "text-sm line-clamp-3",
                size === "xs" && "text-xs line-clamp-2",
                size === "large" && "text-xl",
              )}
            >
              {article.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-muted-foreground line-clamp-2",
                size === "default" && "text-sm",
                size === "small" && "text-xs mt-1 line-clamp-1",
                size === "large" && "text-base",
                size === "xs" && "text-xs mt-1 line-clamp-1",
              )}
            >
              {article.description}
            </p>
          </div>
          <div
            className={cn(
              "mt-4 flex items-center justify-between text-muted-foreground",
              size === "default" && "text-sm",
              size === "small" && "text-xs mt-2",
              size === "large" && "text-base",
              size === "xs" && "text-xs mt-2",
            )}
          >
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Heart
                  className={cn(
                    "mr-1.5 text-red-500",
                    size === "default" && "h-4 w-4",
                    size === "small" && "h-3 w-3 mr-1",
                    size === "large" && "h-5 w-5",
                    size === "xs" && "h-3 w-3 mr-1",
                  )}
                />
                {article.reactionCount}
              </span>
              <span className="flex items-center">
                <MessageCircle
                  className={cn(
                    "mr-1.5",
                    size === "default" && "h-4 w-4",
                    size === "small" && "h-3 w-3 mr-1",
                    size === "large" && "h-5 w-5",
                    size === "xs" && "h-3 w-3 mr-1",
                  )}
                />
                {article.commentCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
