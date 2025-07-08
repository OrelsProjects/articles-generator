import {  motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreateNoteButton } from "./create-note-button";

export function   ActionBar({ className, clientId }: { className?: string, clientId?: string | null }) {
  return (
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("z-50 flex flex-col gap-2 sm:flex-row sm:gap-3", className)}
  >
      <CreateNoteButton clientId={clientId} />
    </motion.div>
  );
}