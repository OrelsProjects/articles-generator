"use client";

import { useEffect, useState } from "react";
import { useGhostwriter } from "@/lib/hooks/useGhostwriter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Settings,
  Users,
  Copy,
  MoreHorizontal,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { GhostwriterClient, MyGhostwriter } from "@/types/ghost-writer";

export const GhostwriterSection = () => {
  const {
    profile,
    profileLoading,
    profileError,
    accessList,
    accessLoading,
    accessError,
    clientList,
    clientLoading,
    clientError,
    fetchProfile,
    fetchAccessList,
    fetchClientList,
    revokeGhostwriterAccess,
    stopGhostwriting,
    openCreateProfileDialog,
    openAddAccessDialog,
    openEditAccessDialog,
  } = useGhostwriter();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"client" | "ghostwriter">(
    "client",
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchProfile(),
          fetchAccessList(),
          fetchClientList(),
        ]);
      } catch (error) {
        console.error("Error initializing ghostwriter data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, [fetchProfile, fetchAccessList, fetchClientList]);

  // Set default tab based on user's data
  useEffect(() => {
    if (!isInitialLoading) {
      const hasActiveGhostwriters = accessList.some(gw => gw.isActive);
      const hasGhostwriterProfile = !!profile;

      if (!hasGhostwriterProfile) {
        setActiveTab("client");
      } else {
        setActiveTab("ghostwriter");
      }
    }
  }, [isInitialLoading, profile, accessList]);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  const handleRevokeAccess = async (ghostwriter: MyGhostwriter) => {
    if (
      window.confirm(
        `Are you sure you want to revoke access for ${ghostwriter.name}?`,
      )
    ) {
      try {
        await revokeGhostwriterAccess(ghostwriter.id);
        toast.success(`Access revoked for ${ghostwriter.name}`);
      } catch (error) {
        toast.error("Failed to revoke access");
      }
    }
  };

  const handleStopGhostwriting = async (client: GhostwriterClient) => {
    if (
      window.confirm(
        `Are you sure you want to stop ghostwriting for ${client.accountUserName}?`,
      )
    ) {
      try {
        await stopGhostwriting({ accessId: client.id });
        toast.success(`Stopped ghostwriting for ${client.accountUserName}`);
      } catch (error) {
        toast.error("Failed to stop ghostwriting");
      }
    }
  };

  const getAccessLevelColor = (level: "full" | "editor") => {
    return level === "full"
      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
      : "bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200";
  };

  const getAccessLevelIcon = (level: "full" | "editor") => {
    return level === "full" ? Shield : Edit;
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ghostwriter Management</h2>
          <p className="text-muted-foreground">
            Manage your ghostwriter profile and access control
          </p>
        </div>
      </div>

      {/* Tabs Container with Scrollable Content */}
      <div className="h-[calc(100vh-200px)] flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={value =>
            setActiveTab(value as "ghostwriter" | "client")
          }
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Client
            </TabsTrigger>
            <TabsTrigger
              value="ghostwriter"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Ghostwriter
            </TabsTrigger>
          </TabsList>

          {/* Ghostwriter Tab */}
          <TabsContent value="ghostwriter" className="flex-1 mt-4">
            <div className="space-y-6 max-h-full overflow-y-auto pr-2">
              {/* Ghostwriter Profile Header */}
              {profile ? (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.image} alt={profile.name} />
                        <AvatarFallback>
                          {profile.name
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="font-semibold">{profile.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Ghostwriter Profile
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openCreateProfileDialog}
                          disabled={profileLoading}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <code className="w-28 px-2 py-1 bg-background rounded text-xs font-mono">
                          {showToken
                            ? profile.token.slice(-8)
                            : "•••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToken(profile.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {profileError && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          Create Ghostwriter Profile
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Offer ghostwriting services to other users
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={openCreateProfileDialog}
                      disabled={profileLoading}
                      size="sm"
                    >
                      {profileLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Create
                    </Button>
                  </div>
                  {profileError && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* My Ghostwriting Clients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Ghostwriting Clients
                  </CardTitle>
                  <CardDescription>
                    Accounts you're currently ghostwriting for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{clientError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Active Clients</h4>
                      <p className="text-sm text-muted-foreground">
                        {clientList.filter(client => client.isActive).length}{" "}
                        active client
                        {clientList.filter(client => client.isActive).length !==
                        1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  {clientLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : clientList.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No Clients Yet</h3>
                      <p className="text-muted-foreground">
                        When account holders give you access, they'll appear
                        here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientList.map(client => {
                        const AccessIcon = getAccessLevelIcon(
                          client.accessLevel,
                        );

                        return (
                          <div
                            key={client.id}
                            className="flex items-center gap-4 p-4 border rounded-lg"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={client.accountUserImage}
                                alt={client.accountUserName}
                              />
                              <AvatarFallback>
                                {client.accountUserName
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">
                                  {client.accountUserName}
                                </h4>
                                {/* <Badge
                                  variant="secondary"
                                  className={getAccessLevelColor(
                                    client.accessLevel,
                                  )}
                                >
                                  <AccessIcon className="h-3 w-3 mr-1" />
                                  {client.accessLevel}
                                </Badge> */}
                                {!client.isActive && (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {client.accountUserEmail}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Since{" "}
                                {new Date(
                                  client.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            {client.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStopGhostwriting(client)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Stop Ghostwriting
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Client Tab */}
          <TabsContent value="client" className="flex-1 mt-4">
            <div className="space-y-6 max-h-full overflow-y-auto pr-2">
              {/* Access Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    My Ghostwriters
                  </CardTitle>
                  <CardDescription>
                    Ghostwriters who have access to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accessError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{accessError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Active Ghostwriters</h4>
                      <p className="text-sm text-muted-foreground">
                        {accessList.filter(gw => gw.isActive).length} active
                        ghostwriter
                        {accessList.filter(gw => gw.isActive).length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant={
                        accessList.length > 0 ? "outline" : "outline-primary"
                      }
                      onClick={openAddAccessDialog}
                      disabled={accessLoading}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Ghostwriter
                    </Button>
                  </div>

                  {accessLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : accessList.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">
                        No Ghostwriters Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Add ghostwriters to help manage your content
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {accessList.map(ghostwriter => {
                        const AccessIcon = getAccessLevelIcon(
                          ghostwriter.accessLevel,
                        );

                        return (
                          <div
                            key={ghostwriter.id}
                            className="flex items-center gap-4 p-4 border rounded-lg"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={ghostwriter.image}
                                alt={ghostwriter.name}
                              />
                              <AvatarFallback>
                                {ghostwriter.name
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">
                                  {ghostwriter.name}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={getAccessLevelColor(
                                    ghostwriter.accessLevel,
                                  )}
                                >
                                  <AccessIcon className="h-3 w-3 mr-1" />
                                  {ghostwriter.accessLevel}
                                </Badge>
                                {!ghostwriter.isActive && (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {ghostwriter.accessLevel === "full"
                                  ? "Full access to your account"
                                  : "Limited editing access"}
                              </p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    openEditAccessDialog(ghostwriter)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Access
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRevokeAccess(ghostwriter)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Revoke Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
