import { NotesEditorDialog } from "@/components/notes/note-editor-dialog";
import { ImageModal } from "@/components/ui/image-modal";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen relative">
      <NotesEditorDialog />
      <ImageModal />
      {children}
    </div>
  );
}
