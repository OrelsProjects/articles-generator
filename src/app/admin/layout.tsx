"use client";

import React, { createContext, useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

interface AdminAuthContextType {
  isAuthorized: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (password: string) => {
    if (password === process.env.NEXT_PUBLIC_SYSTEM_PASSWORD) {
      setIsAuthorized(true);
      setError(null);
    } else {
      setError("Invalid password");
      throw new Error("Invalid password");
    }
  };

  const logout = () => {
    setIsAuthorized(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
            try {
              await login(password);
            } catch (err) {
              // Error is handled in state
            }
          }}
          className="w-full max-w-sm space-y-4 p-8 bg-card rounded-lg shadow-lg"
        >
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
          <div className="space-y-2">
            <Input
              type="password"
              name="password"
              placeholder="Enter system password"
              className="w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            Access Admin Panel
          </Button>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthorized, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider forcedTheme="dark">
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </ThemeProvider>
  );
}
