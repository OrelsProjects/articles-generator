import { Button } from "@/components/ui/button";
import { buildNewDraftUrl } from "@/lib/utils/url";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SendToDraftButton({
  publicationUrl,
  variant = "outline",
  className,
}: {
  publicationUrl: string | null;
  variant?: "outline" | "ghost";
  className?: string;
}) {
  if (!publicationUrl) {
    return null;
  }

  const draftUrl = buildNewDraftUrl(publicationUrl);

  return (
    <Button asChild variant={variant} className="h-fit">
      <Link
        href={draftUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <ExternalLink className="w-4 h-4 ml-2" />
        Create draft in Substack
      </Link>
    </Button>
  );
}
