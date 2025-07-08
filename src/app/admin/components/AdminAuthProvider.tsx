"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

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

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const lastLogin = localStorage.getItem("lastLogin");
    if (lastLogin) {
      const isExpired = new Date(lastLogin).getTime() + 1000 * 60 * 60 * 144 < Date.now(); // 72 hours
      if (isExpired) {
        localStorage.removeItem("lastLogin");
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, []);

  const login = async (password: string) => {
    if (password === process.env.NEXT_PUBLIC_SYSTEM_PASSWORD) {
      setIsAuthorized(true);
      localStorage.setItem("lastLogin", new Date().toISOString());
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
            } catch (error: any) {
              // Error is handled in state
            }
          }}
          className="w-full max-w-sm space-y-4 p-8 bg-card rounded-lg shadow-lg"
        >
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter system password"
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
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