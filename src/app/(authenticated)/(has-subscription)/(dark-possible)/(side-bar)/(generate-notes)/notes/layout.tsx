import GenerateNotesSidebar from "@/components/home/generate-notes-sidebar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GenerateNotesSidebar />
      {children}
    </>
  );
}
