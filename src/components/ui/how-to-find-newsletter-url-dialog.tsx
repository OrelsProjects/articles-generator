import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import Image from "next/image";

export default function HowToFindNewsletterUrlDialog() {
  return (
    <Dialog>
        <DialogTrigger asChild>
          <Button variant="link">How to find the newsletter URL?</Button>
        </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>How to find the newsletter URL</DialogTitle>
        <DialogDescription>
          <p>
            To find the newsletter URL, you need to go to the newsletter page
            and copy the URL.
          </p>
        </DialogDescription>
        <div>
          <h3>Step 1: Go to your profile page and see your newsletters</h3>
          <Image
            src="/onboarding/onboarding-newsletters.png"
            alt="Step 1"
            width={1000}
            height={1000}
          />
          <p className="text-base text-muted-foreground">Choose the newsletter you want as your primary newsletter.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h3>Step 2: Copy the URL of the newsletter</h3>
          <Image
            src="/onboarding/onboarding-url.png"
            alt="Step 2"
            width={1000}
            height={1000}
          />
          <p className="text-base text-muted-foreground">
            See the newsletter&apos;s URL in the address bar and use it in the
            analysis page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
