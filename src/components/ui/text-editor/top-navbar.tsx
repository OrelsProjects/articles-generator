import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export const TopNav = () => {
  return (
    <div className="w-full flex items-center justify-between px-4 py-2 bg-background z-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 text-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-muted-foreground">Draft</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="text-lg">
          Preview
        </Button>
        <Button variant="default" className="text-lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
