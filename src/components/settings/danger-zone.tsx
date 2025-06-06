import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import useAuth from "@/lib/hooks/useAuth";

export function DangerZone() {
  const { user } = useAppSelector(selectAuth);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteUser } = useAuth();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("");
    }
    setShowDeleteDialog(open);
  };

  const handleDeleteAccount = async () => {
    // Validate the confirmation text
    if (user?.email) {
      if (confirmText !== user.email) {
        toast.error("Please type your email to confirm");
        return;
      }
    } else if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUser();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-red-800/20 bg-red-950/5">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanent actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-500">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Delete Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-950/10 border border-red-800/20 rounded-md p-4">
              <h3 className="font-semibold text-red-500 mb-2">
                Warning: This action cannot be undone
              </h3>
              <p className="text-sm text-foreground">
                Deleting your account will:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-foreground">
                <li>Permanently delete all your notes and posts</li>
                <li>Cancel any active subscriptions (immediately)</li>
                <li>Remove all your data from our systems</li>
                <li>Cancel all your active scheduled notes</li>
                <li>Immediately revoke your access to all services</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Instead of deleting your account, would you consider:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>Taking a break and coming back later?</li>
              <li>
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <a href="mailto:orelsmail@gmail.com">
                    Contact me on my personal email
                  </a>
                </Button>
              </li>
            </ul>

            <div className="pt-4 border-t border-border">
              <Label
                htmlFor="confirm-delete"
                className="text-destructive font-medium"
              >
                Type {user?.email ? user.email : "DELETE"} to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={user?.email ? "Your email" : "DELETE"}
                className="mt-1 border-red-800/30 focus-visible:ring-red-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                (user?.email
                  ? confirmText !== user.email
                  : confirmText !== "DELETE") || isDeleting
              }
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
