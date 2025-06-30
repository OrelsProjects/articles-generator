import Loading from "@/components/ui/loading";

export function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loading spinnerClassName="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
