import GenerateIdeasButton from "@/components/ui/generate-ideas-button";
import { toast } from "react-toastify";

export interface BlankPageProps {
  hasPublication: boolean;
}
export default function BlankPage({ hasPublication }: BlankPageProps) {

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] w-full">
      <div className="flex flex-col items-center justify-center h-full w-fit border border-border rounded-lg px-24 py-4">
        <h2 className="text-3xl font-bold mb-4 text-center">
          This is the last blank page you&apos;ll see.
        </h2>
        <p className="text-lg max-w-md text-center mb-1">
          {hasPublication ? (
            "Good! Now generate your first idea."
          ) : (
            <span>
              Connect your Substack account above or create a new draft.
              <br />
              <span className="text-muted-foreground">
                (You can always connect your Substack later through the
                settings)
              </span>
            </span>
          )}
        </p>
        {hasPublication && <GenerateIdeasButton />}
      </div>
    </div>
  );
}
