import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/hooks/useSettings";
import Link from "next/link";
import DraftIndicator from "@/components/ui/text-editor/draft-indicator";

export function Header({
  className,
  draftStatus,
}: {
  className?: string;
  draftStatus?: { error: boolean; saving: boolean };
}) {
  const { signOut } = useAuth();
  const { hasPublication } = useSettings();
  const { publications } = useAppSelector(state => state.publications);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  const handleLogout = () => {
    signOut();
  };

  return (
    <motion.header
      key={`header`}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-background px-4 border-b border-border z-10 py-4 relative",
        className,
      )}
    >
      <div className="flex items-center justify-center col-span-1 gap-4 relative">
        <Button variant="ghost" size="icon" asChild className="bg-muted">
          <Link href="/home" className="hover:cursor-pointer">
            <ChevronLeft className="hover:cursor-pointer" size={24} />
          </Link>
        </Button>
        <DraftIndicator
          saving={!!draftStatus?.saving}
          error={!!draftStatus?.error}
          hasIdea={hasPublication}
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 col-span-2">
        {publication?.image && (
          <Button variant="ghost" size="icon" className="rounded-md">
            <Image
              src={publication.image}
              alt={publication.title || ""}
              width={36}
              height={36}
              className="rounded-md"
            />
          </Button>
        )}
        <h1 className="text-2xl font-bold text-center">{publication?.title}</h1>
      </div>
    </motion.header>
  );
}
