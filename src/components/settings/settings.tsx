"use client";

import { BillingSettings } from "@/components/settings/billing-settings";
import { PublicationSettings } from "@/components/settings/publication-settings";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cog } from "lucide-react";

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-start px-2 space-x-2"
        >
          <Cog className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-10 max-h-[70vh] overflow-y-auto pr-4">
          <section id="publication">
            <PublicationSettings />
          </section>
          <Separator />
          <section id="billing">
            <BillingSettings />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
