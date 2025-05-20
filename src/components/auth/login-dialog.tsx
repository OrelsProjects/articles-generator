"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import useAuth from "@/lib/hooks/useAuth";
import { EventTracker } from "@/eventTracker";
import { useEffect } from "react";

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  redirectPath?: string;
  additionalRedirectParams?: string;
}

export function LoginDialog({
  isOpen,
  onOpenChange,
  title = "Login to continue",
  description = "To avoid abuse and keep this tool a unique experience, you'll need to quickly sign up (Less than 10 seconds).",
  redirectPath,
  additionalRedirectParams = "",
}: LoginDialogProps) {
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    if (isOpen) {
      EventTracker.track("login_dialog_view", { path: redirectPath });
    }
  }, [isOpen, redirectPath]);

  const getRedirectURL = () => {
    if (!redirectPath) return undefined;

    const baseRedirect = `?redirect=${redirectPath}`;
    return additionalRedirectParams
      ? `${baseRedirect}${additionalRedirectParams}`
      : baseRedirect;
  };

  const handleGoogleSignIn = () => {
    EventTracker.track("login_dialog_google_click", { path: redirectPath });
    signInWithGoogle(getRedirectURL());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" backgroundBlur>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full py-6 text-lg font-semibold transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <FcGoogle className="mr-2 h-6 w-6" /> Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full"></div>
            <span className="bg-background text-muted-foreground px-3 text-sm absolute mb-1.5">
              or
            </span>
          </div>

          <EmailSignIn />

          <div className="text-sm text-muted-foreground">
            <p>
              With a free account, you&apos;ll be able to use all current and
              future free tools.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
