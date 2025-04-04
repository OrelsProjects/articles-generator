import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";
import { ImageModal } from "@/components/ui/image-modal";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen relative">
      <GenerateNotesSidebar />
      <ImageModal />
      {children}
    </div>
  );
}
