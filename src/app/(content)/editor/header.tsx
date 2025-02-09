import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
export function Header({ className }: { className?: string }) {
  const { publications } = useAppSelector(state => state.publications);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  if (!publication) return null;

  return (
    <header
      className={cn(
        "w-full flex items-center justify-center gap-4 bg-background px-4 border-b border-border py-2 md:py-4 z-10",
        className,
      )}
    >
      <Link href="/editor" className="flex items-center gap-4">
        {publication.image && (
          <Image
            src={publication.image}
            alt={publication.title || ""}
            width={34}
            height={34}
            className="rounded-md"
          />
        )}
        <h1 className="text-xl font-bold">{publication.title}</h1>
      </Link>
    </header>
  );
}
