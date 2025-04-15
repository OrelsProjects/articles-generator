import { useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { usePublicationSettings } from "@/lib/hooks/usePublicationSettings";

export default function RefreshPublicationData() {
  const { settings } = useAppSelector(selectSettings);
  const { refreshPublicationData } = usePublicationSettings();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRefresh = async () => {
    try {
      await refreshPublicationData();
      toast.success("Publication data refreshed successfully");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error refreshing publication data:", error);
      toast.error("Failed to refresh publication data");
      setDialogOpen(true);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="neumorphic-primary"
          disabled={settings.generatingDescription}
          onClick={() => setDialogOpen(true)}
        >
          {settings.generatingDescription && (
            <RefreshCcw
              className={cn("h-4 w-4 mr-2", {
                "animate-spin": settings.generatingDescription,
              })}
            />
          )}
          Refresh data (10)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
            Refresh Publication Data
          </DialogTitle>
          <DialogDescription>
            This action will refresh all of your previously generated
            descriptions and may take some time to complete.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            When you refresh your publication data:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              All AI-generated descriptions will be regenerated with all your
              latest data
            </li>
            <li>
              Your Personal description and preferred topics will not be
              affected
            </li>
            <li>Your inspiration page might have different results</li>
            <li>You will get an email once the data is refreshed</li>
            <li>This will use 10 credits</li>
          </ul>

          {/* <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mt-4">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Are you sure you want to proceed?
              </p>
            </div> */}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={settings.generatingDescription}
            >
              Cancel
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={handleRefresh}
              disabled={settings.generatingDescription}
              className="gap-2"
            >
              {settings.generatingDescription && (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              )}
              {settings.generatingDescription
                ? "Refreshing..."
                : "Yes, Refresh Data"}
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
