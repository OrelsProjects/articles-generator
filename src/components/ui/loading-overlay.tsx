import Loading from "@/components/ui/loading";

export function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loading className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
