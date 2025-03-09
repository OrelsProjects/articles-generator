import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen">
      <GenerateNotesSidebar />
      {children}
    </div>
  );
}
