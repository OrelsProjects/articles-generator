import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen">
      <GenerateNotesSidebar />
      {children}
    </div>
  );
}
