import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotesEditorDialog } from "@/components/notes/note-editor-dialog";
import { ImageModal } from "@/components/ui/image-modal";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

import { Suspense } from "react";

export default function SideBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // console.log("%c🔥 layout rendered", "color: red; font-size: 20px");

  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingOverlay />}>
        <NotesEditorDialog />
        <ImageModal />
        {children}
      </Suspense>
    </ThemeProvider>
  );
}
