"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  RefreshCw,
  Search,
  Copy,
  Check,
  Ban,
  RotateCw,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FreeUserStatus } from "@prisma/client";
import { TooltipButton } from "@/components/ui/tooltip-button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface FreeUser {
  id: string;
  email: string | null;
  code: string | null;
  status: FreeUserStatus;
  codeExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  url: string | null;
  name: string | null;
}

const statusColors: Record<FreeUserStatus, string> = {
  new: "text-green-500",
  used: "text-blue-500",
  revoked: "text-red-500",
};

export default function FreeUsersPage() {
  const [users, setUsers] = useState<FreeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/free-user");
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const generateNewUser = async () => {
    if (!newUserName.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/free-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newUserName.trim() }),
      });
      if (!response.ok) throw new Error("Failed to generate new user");
      const { freeUser } = await response.json();
      setUsers(prev => [freeUser, ...prev]);
      setError(null);
      setNewUserDialogOpen(false);
      setNewUserName("");
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to generate new user",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/free-user`, {
        method: "PATCH",
        body: JSON.stringify({ id, status: "revoked" }),
      });
      if (!response.ok) throw new Error("Failed to revoke user");

      setUsers(prev =>
        prev.map(user =>
          user.id === id
            ? { ...user, status: "revoked" as FreeUserStatus }
            : user,
        ),
      );
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to revoke user",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/free-user`, {
        method: "PATCH",
        body: JSON.stringify({ id, refreshExpiresAt: true }),
      });
      if (!response.ok) throw new Error("Failed to refresh code");
      const data = await response.json();

      setUsers(prev =>
        prev.map(user =>
          user.id === id ? { ...user, code: data.code } : user,
        ),
      );
    } catch (error: any) {
      setError(
        error instanceof Error ? error.message : "Failed to refresh code",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter(
        user =>
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.code?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : users;

  return (
    <div className="container mx-auto py-10 flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Potential Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Free Users</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewUserDialogOpen(true)}
            variant="default"
            disabled={loading}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Generate New User
          </Button>
          <Button
            onClick={fetchUsers}
            variant="outline"
            disabled={loading}
            className="gap-2 text-base"
          >
            <RefreshCw className={cn("h-5 w-5", { "animate-spin": loading })} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by email or code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 w-full max-w-sm"
        />
        {searchQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {filteredUsers.length} results
          </div>
        )}
      </div>

      {error && (
        <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md text-base">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-base">Name</TableHead>
              <TableHead className="font-semibold text-base">Email</TableHead>
              <TableHead className="font-semibold text-base">Code</TableHead>
              <TableHead className="font-semibold text-base">Status</TableHead>
              <TableHead className="font-semibold text-base text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-base">
                  {user.name || "-"}
                </TableCell>
                <TableCell className="font-medium text-base">
                  {user.email}
                </TableCell>
                <TableCell className="text-base">{user.code}</TableCell>
                <TableCell className="text-base">
                  <span
                    className={cn("font-medium", statusColors[user.status])}
                  >
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {user.code && (
                      <TooltipButton
                        tooltipContent="Copy Code"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleCopy(user.url || "", user.id)}
                        disabled={actionLoading === user.id}
                      >
                        {copied === user.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </TooltipButton>
                    )}
                    <TooltipButton
                      tooltipContent="Revoke Access"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleRevoke(user.id)}
                      disabled={
                        actionLoading === user.id || user.status === "revoked"
                      }
                    >
                      <Ban className="h-5 w-5" />
                    </TooltipButton>
                    <TooltipButton
                      tooltipContent="Refresh Code"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleRefresh(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <RotateCw className="h-5 w-5" />
                      )}
                    </TooltipButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle aria-label="Generate New User">
              Generate New User
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Who is this for?</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Enter name..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateNewUser}
              disabled={!newUserName.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
