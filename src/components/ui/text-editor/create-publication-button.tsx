import { usePublication } from "@/lib/hooks/usePublication";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { AlertCircle, Link2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogClose } from "@radix-ui/react-dialog";
import { useAppSelector } from "@/lib/hooks/redux";

const loadingStates = [
  { text: "Validating URL format..." },
  { text: "Checking Substack availability..." },
  { text: "Connecting to your newsletter..." },
  { text: "Setting up your preferences..." },
  { text: "Almost done..." },
];

export function CreatePublicationButton() {
  const { analyzePublication } = usePublication();
  const { publications } = useAppSelector(state => state.publications);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publications.length > 0) {
      setOpen(false);
    }
  }, [publications]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Simulate async operation
      await analyzePublication(url);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="create-publication-button">
      <Button onClick={() => setOpen(true)}>
        <Link2 className="mr-2 h-4 w-4" />
        Connect Substack
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect your Substack</DialogTitle>
            <DialogDescription>
              Enter your Substack URL to connect your newsletter. We&apos;ll
              sync your content and subscribers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="substackUrl"
                placeholder="your-blog.substack.com"
                className="col-span-4"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="flex flex-row items-center pb-1.5"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="leading-7">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!url.trim() || loading}
            >
              Connect Newsletter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && (
        <MultiStepLoader
          loadingStates={loadingStates}
          loading={loading}
          duration={4500}
          loop={false}
        />
      )}
    </div>
  );
}
