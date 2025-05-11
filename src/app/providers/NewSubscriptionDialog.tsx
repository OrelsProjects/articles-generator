"use client";

import { CheckCircle, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

export default function NewSubscriptionDialog() {
  const router = useCustomRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  const success = useMemo(() => searchParams.has("success"), [searchParams]);

  useEffect(() => {
    if (success) {
      setOpen(true);
    }
  }, [success]);

  const handleOpenCheckout = (open: boolean) => {
    if (!open) {
      router.push(pathname, {
        preserveQuery: true,
        paramsToRemove: ["success", "plan"],
      });
      setOpen(false);
    }
  };

  return (
    <Dialog onOpenChange={open => handleOpenCheckout(open)} open={open}>
      <DialogContent hideCloseButton closeOnOutsideClick={false}>
        <DialogClose className="absolute top-4 right-4 z-30">
          <X className="h-7 w-7 text-muted-foreground" />
        </DialogClose>

        <DialogHeader className="flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <DialogTitle
            aria-label="Purchase Successful"
            className="text-3xl font-bold"
          >
            <p className="text-2xl">Purchase Successful!</p>
          </DialogTitle>
        </DialogHeader>

        <p className="text-start text-lg">
          You’re all set! Thank you for choosing <strong>WriteStack</strong>.
          Ready to write smarter?
        </p>

        <DialogFooter className="flex justify-center">
          <Button size="lg" onClick={() => handleOpenCheckout(false)}>
            Start Writing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
