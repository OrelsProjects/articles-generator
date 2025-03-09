"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Edit, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAppSelector(selectAuth);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    bio: "Tell us about yourself...",
    location: "",
    website: "",
    twitter: "",
    github: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // Here you would typically dispatch an action to update the user profile
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button 
          variant={isEditing ? "default" : "outline"}
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={user?.image || ""} alt={profileData.displayName} />
              <AvatarFallback>{profileData.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="outline" size="sm">
                Change Picture
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName"
                name="displayName"
                value={profileData.displayName}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                value={user?.email || ""}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Your email address is used for login and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location"
                name="location"
                value={profileData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website"
                name="website"
                value={profileData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input 
                  id="twitter"
                  name="twitter"
                  value={profileData.twitter}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input 
                  id="github"
                  name="github"
                  value={profileData.github}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your activity and usage statistics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Notes Created</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Words Written</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 