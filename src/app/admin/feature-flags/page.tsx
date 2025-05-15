"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { FeatureFlag } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";
import moment from "moment-timezone";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axios-instance";

interface UserMetadata {
  id: string;
  featureFlags: string[];
  isAdmin: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  latestVisit: Date | null;
  planEndsAt: Date | null;
  isFree: boolean;
  userMetadata: UserMetadata | null;
}

// All feature flags from the Prisma enum
const allFeatureFlags = Object.values(FeatureFlag);

// Sort types
type SortField = "name" | "latestVisit" | "planEndsAt";
type SortOrder = "asc" | "desc";

export default function FeatureFlagsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    order: SortOrder;
  }>({
    field: "name",
    order: "asc",
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    newStatus: boolean;
  }>({
    isOpen: false,
    userId: "",
    userName: "",
    newStatus: false,
  });

  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email;

  // Fetch all users with their feature flags
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/admin/feature-flags");
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users' feature flags");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    const name = user.name?.toLowerCase() || "";
    const email = user.email?.toLowerCase() || "";

    return name.includes(searchTermLower) || email.includes(searchTermLower);
  });

  const itemsNoNullVisit = [...filteredUsers].filter(user => user.latestVisit);
  const itemsWithNullVisit = [...filteredUsers].filter(
    user => !user.latestVisit,
  );

  // Sort users
  const sortedUsers = [...itemsNoNullVisit].sort((a, b) => {
    if (sortConfig.field === "name") {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      return sortConfig.order === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else if (sortConfig.field === "latestVisit") {
      // Handle null dates by putting them at the end
      if (!a.latestVisit && !b.latestVisit) return 0;
      if (!a.latestVisit) return sortConfig.order === "asc" ? 1 : -1;
      if (!b.latestVisit) return sortConfig.order === "asc" ? -1 : 1;

      return sortConfig.order === "asc"
        ? new Date(a.latestVisit).getTime() - new Date(b.latestVisit).getTime()
        : new Date(b.latestVisit).getTime() - new Date(a.latestVisit).getTime();
    } else if (sortConfig.field === "planEndsAt") {
      // Handle null dates by putting them at the end
      if (!a.planEndsAt && !b.planEndsAt) return 0;
      if (!a.planEndsAt) return sortConfig.order === "asc" ? 1 : -1;
      if (!b.planEndsAt) return sortConfig.order === "asc" ? -1 : 1;

      return sortConfig.order === "asc"
        ? new Date(a.planEndsAt).getTime() - new Date(b.planEndsAt).getTime()
        : new Date(b.planEndsAt).getTime() - new Date(a.planEndsAt).getTime();
    }
    return 0;
  }).concat(itemsWithNullVisit);

  // Toggle sort order
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Toggle order if the same field
        return { field, order: prevConfig.order === "asc" ? "desc" : "asc" };
      } else {
        // New field, start with ascending
        return { field, order: "asc" };
      }
    });
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortConfig.order === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  // Update feature flag for a user
  const toggleFeatureFlag = async (
    userId: string,
    featureFlag: string,
    enabled: boolean,
  ) => {
    const updateKey = `${userId}-${featureFlag}`;
    try {
      setUpdating(prev => ({ ...prev, [updateKey]: true }));

      await axiosInstance.patch("/api/admin/feature-flags", {
        userId,
        featureFlag,
        enabled,
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === userId && user.userMetadata) {
            const currentFlags = [...user.userMetadata.featureFlags];

            if (enabled && !currentFlags.includes(featureFlag)) {
              currentFlags.push(featureFlag);
            } else if (!enabled && currentFlags.includes(featureFlag)) {
              const index = currentFlags.indexOf(featureFlag);
              currentFlags.splice(index, 1);
            }

            return {
              ...user,
              userMetadata: {
                ...user.userMetadata,
                featureFlags: currentFlags,
              },
            };
          }
          return user;
        }),
      );

      toast.success(
        `${featureFlag} has been ${enabled ? "enabled" : "disabled"} for ${
          users.find(u => u.id === userId)?.name || userId
        }`,
      );
    } catch (err) {
      console.error("Error updating feature flag:", err);
      toast.error("Failed to update feature flag");
    } finally {
      setUpdating(prev => ({ ...prev, [updateKey]: false }));
    }
  };

  // Function to handle admin toggle click
  const handleAdminToggle = (
    userId: string,
    userName: string,
    newStatus: boolean,
  ) => {
    setConfirmDialog({
      isOpen: true,
      userId,
      userName: userName || userId,
      newStatus,
    });
  };

  // Update admin status for a user (after confirmation)
  const toggleAdminStatus = async (
    userId: string,
    adminData?: { enabled: boolean },
  ) => {
    const updateKey = `${userId}-admin`;
    try {
      setUpdating(prev => ({ ...prev, [updateKey]: true }));

      await axiosInstance.patch("/api/admin/feature-flags", {
        userId,
        adminData,
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === userId && user.userMetadata) {
            const metadata = user.userMetadata;

            return {
              ...user,
              userMetadata: {
                ...metadata,
                isAdmin: adminData?.enabled || metadata.isAdmin,
              },
            };
          }
          return user;
        }),
      );

      toast.success(
        `Admin status ${adminData?.enabled ? "enabled" : "disabled"} for ${
          users.find(u => u.id === userId)?.name || userId
        }`,
      );
    } catch (err) {
      console.error("Error updating admin status:", err);
      toast.error("Failed to update admin status");
    } finally {
      setUpdating(prev => ({ ...prev, [updateKey]: false }));
    }
  };

  // Determine if a feature flag is enabled for a user
  const hasFeatureFlag = (user: User, flag: string): boolean => {
    if (!user.userMetadata) return false;
    return user.userMetadata.featureFlags.includes(flag);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Feature Flags Management</h1>

      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div
          className="w-full overflow-auto"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <table className="w-full border-collapse">
            <thead
              className="bg-muted sticky top-0"
              style={{ position: "sticky", top: 0, zIndex: 10 }}
            >
              <tr>
                <th
                  className="p-3 text-left font-medium text-sm border-b border-border cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    User
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="p-3 text-left font-medium text-sm border-b border-border">
                  Plan
                </th>
                <th
                  className="p-3 text-left font-medium text-sm border-b border-border cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("latestVisit")}
                >
                  <div className="flex items-center">
                    Latest Visit
                    {getSortIcon("latestVisit")}
                  </div>
                </th>
                <th className="p-3 text-center font-medium text-sm border-b border-border">
                  Admin
                </th>
                <th
                  className="p-3 text-left font-medium text-sm border-b border-border cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("planEndsAt")}
                >
                  <div className="flex items-center">
                    Plan Ends At
                    {getSortIcon("planEndsAt")}
                  </div>
                </th>
                {allFeatureFlags.map(flag => (
                  <th
                    key={flag}
                    className="p-3 text-center font-medium text-sm border-b border-border"
                  >
                    {flag}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map(user => {
                const isCurrentUser = user.email === currentUserEmail;
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-border hover:bg-muted/60 transition-colors",
                      !user.isFree ? "bg-green-50 dark:bg-green-950/20" : "",
                    )}
                  >
                    <td className="p-3">
                      <div className="font-medium">
                        {user.name || "No name"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">
                            (You)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      {user.plan ? (
                        <Badge
                          variant={!user.isFree ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {user.plan}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No plan</Badge>
                      )}
                    </td>

                    <td className="p-3">
                      {user.latestVisit ? (
                        <Badge variant="outline">
                          {moment(user.latestVisit)
                            .tz("Asia/Jerusalem")
                            .format("DD/MM, HH:MM")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No visits</Badge>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {updating[`${user.id}-admin`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Switch
                            checked={user.userMetadata?.isAdmin || false}
                            onCheckedChange={checked =>
                              handleAdminToggle(
                                user.id,
                                user.name || "",
                                checked,
                              )
                            }
                            disabled={isCurrentUser || loading}
                          />
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      {user.planEndsAt ? (
                        <Badge variant={!user.isFree ? "secondary" : "outline"}>
                          {moment(user.planEndsAt)
                            .tz("Asia/Jerusalem")
                            .format("DD/MM/YYYY")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No end date</Badge>
                      )}
                    </td>

                    {allFeatureFlags.map(flag => {
                      const updateKey = `${user.id}-${flag}`;
                      const isEnabled = hasFeatureFlag(user, flag);

                      return (
                        <td key={flag} className="p-3 text-center">
                          <div className="flex justify-center">
                            {updating[updateKey] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={checked =>
                                  toggleFeatureFlag(user.id, flag, checked)
                                }
                                disabled={loading}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {sortedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6 + allFeatureFlags.length}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={isOpen => {
          if (!isOpen) setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {confirmDialog.newStatus ? "enable" : "disable"}{" "}
              admin privileges for <strong>{confirmDialog.userName}</strong>.
              {confirmDialog.newStatus
                ? " This will give them full access to administrative functions."
                : " This will revoke their administrative access."}
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toggleAdminStatus(confirmDialog.userId, {
                  enabled: confirmDialog.newStatus,
                });
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
            >
              {confirmDialog.newStatus ? "Enable Admin" : "Disable Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
