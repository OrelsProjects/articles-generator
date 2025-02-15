import { Button } from "@/components/ui/button";
import { buildNewDraftUrl } from "@/lib/utils/url";
import Link from "next/link";

export default function SendToDraftButton({
  publicationUrl,
}: {
  publicationUrl: string | null;
}) {
  if (!publicationUrl) {
    return null;
  }

  const draftUrl = buildNewDraftUrl(publicationUrl);

  return (
    <Button asChild variant="outline">
      <Link href={draftUrl} target="_blank" rel="noopener noreferrer">
        Create draft in Substack
      </Link>
    </Button>
  );
}
