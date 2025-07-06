"use client";

import { useState } from "react";
import { useGhostwriter } from "@/lib/hooks/useGhostwriter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, Shield, Edit } from "lucide-react";
import { toast } from "react-toastify";
import { CreateGhostwriterProfileData } from "@/types/ghost-writer";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { useAppSelector } from "@/lib/hooks/redux";

export const GhostwriterDialogs = () => {
  useGhostwriter();

  return (
    <>
      <CreateProfileDialog />
      <AddAccessDialog />
      <EditAccessDialog />
    </>
  );
};

// Create/Edit Profile Dialog
const CreateProfileDialog = () => {
  const { user } = useAppSelector(selectAuth);
  const {
    profile,
    showCreateProfileDialog,
    createOrUpdateProfile,
    closeCreateProfileDialog,
  } = useGhostwriter();

  const [formData, setFormData] = useState<CreateGhostwriterProfileData>({
    name: profile?.name || user?.displayName || "",
    image: profile?.image || user?.image || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrUpdateProfile(formData);
      toast.success(
        profile
          ? "Profile updated successfully"
          : "Profile created successfully",
      );
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a service and get a URL
      // For now, we'll use a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog
      open={showCreateProfileDialog}
      onOpenChange={closeCreateProfileDialog}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {profile
              ? "Edit Ghostwriter Profile"
              : "Create Ghostwriter Profile"}
          </DialogTitle>
          <DialogDescription>
            {profile
              ? "Update your ghostwriter profile information"
              : "Create a profile to offer ghostwriting services to other users"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Profile Image *</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={formData.image} alt="Profile" />
                <AvatarFallback>
                  {formData.name
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a profile image (JPG, PNG, or GIF)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateProfileDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {profile ? "Update Profile" : "Create Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Access Dialog
const AddAccessDialog = () => {
  const { showAddAccessDialog, addGhostwriterAccess, closeAddAccessDialog } =
    useGhostwriter();

  const [formData, setFormData] = useState({
    ghostwriterToken: "",
    accessLevel: "editor" as "full" | "editor",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ghostwriterToken) {
      toast.error("Please enter a ghostwriter token");
      return;
    }

    try {
      setIsSubmitting(true);
      await addGhostwriterAccess(formData);
      toast.success("Ghostwriter access added successfully");
      setFormData({ ghostwriterToken: "", accessLevel: "editor" });
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("This ghostwriter already has access");
      } else if (error.response?.status === 400) {
        toast.error("Invalid ghostwriter token");
      } else {
        toast.error("Failed to add ghostwriter access");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={showAddAccessDialog} onOpenChange={closeAddAccessDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Ghostwriter Access</DialogTitle>
          <DialogDescription>
            Grant a ghostwriter access to your account by entering their token
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Ghostwriter Token *</Label>
            <Input
              id="token"
              placeholder="Enter ghostwriter token"
              value={formData.ghostwriterToken}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  ghostwriterToken: e.target.value,
                }))
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Ask the ghostwriter to provide their access token
            </p>
          </div>

          {/* <div className="space-y-3">
            <Label>Access Level</Label>
            <RadioGroup
              value={formData.accessLevel}
              onValueChange={(value: "editor" | "full") =>
                setFormData(prev => ({ ...prev, accessLevel: value }))
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="full" id="full" />
                <div className="flex-1">
                  <Label
                    htmlFor="full"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-medium">Full Access</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Complete access to your account including publishing
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="editor" id="editor" />
                <div className="flex-1">
                  <Label
                    htmlFor="editor"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-medium">Editor Access</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Limited access for editing and content creation
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div> */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeAddAccessDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Ghostwriter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Access Dialog
const EditAccessDialog = () => {
  const {
    showEditAccessDialog,
    editingAccess,
    updateGhostwriterAccess,
    closeEditAccessDialog,
  } = useGhostwriter();

  const [formData, setFormData] = useState({
    accessLevel: editingAccess?.accessLevel || ("full" as "full" | "editor"),
    isActive: editingAccess?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccess) return;

    try {
      setIsSubmitting(true);
      await updateGhostwriterAccess({
        ghostwriterId: editingAccess.id,
        accessLevel: formData.accessLevel,
        isActive: formData.isActive,
      });
      toast.success("Access updated successfully");
    } catch (error) {
      toast.error("Failed to update access");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editingAccess) return null;

  return (
    <Dialog open={showEditAccessDialog} onOpenChange={closeEditAccessDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Ghostwriter Access</DialogTitle>
          <DialogDescription>
            Update access settings for {editingAccess.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div className="space-y-3">
            <Label>Access Level</Label>
            <RadioGroup
              value={formData.accessLevel}
              onValueChange={(value: "full" | "editor") =>
                setFormData(prev => ({ ...prev, accessLevel: value }))
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="full" id="edit-full" />
                <div className="flex-1">
                  <Label
                    htmlFor="edit-full"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-medium">Full Access</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Complete access to your account including publishing
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="editor" id="edit-editor" />
                <div className="flex-1">
                  <Label
                    htmlFor="edit-editor"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-medium">Editor Access</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Limited access for editing and content creation
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div> */}

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active Access</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this ghostwriter's access
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditAccessDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
