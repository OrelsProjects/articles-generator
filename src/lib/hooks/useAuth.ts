"use client";

import { signIn, signOut as signOutAuth } from "next-auth/react";
import { useCallback, useState } from "react";
import { clearUser, setError } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { EventTracker } from "@/eventTracker";
import { Logger } from "@/logger";
import axiosInstance from "@/lib/axios-instance";
import { useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

const useAuth = () => {
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const redirect = searchParams.get("redirect") || undefined;

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    try {
      Logger.info("Signing in with Google", { redirectTo, redirect });
      const redirectDefault = "/onboarding";
      let redirectPath = new URL(`${window.location.origin}`);
      try {
        redirectPath = new URL(
          `${window.location.origin}${redirectTo || redirect || redirectDefault}`,
        );
      } catch (error: any) {
        Logger.error("Error parsing redirect path", {
          error,
          redirectTo,
          redirect,
          redirectDefault,
        });
      }

      // preserve query params
      searchParams.forEach((val, key) => {
        if (!redirectPath.searchParams.has(key)) {
          redirectPath.searchParams.append(key, val);
        }
      });

      Logger.info("Redirect path", { redirectPath: redirectPath.toString() });

      setLoading(true);
      await signIn("google", {
        redirect: true,
        callbackUrl: redirectPath.toString(),
      });
    } catch (error: any) {
      if (error?.name === "UserAlreadyAuthenticatedException") {
        EventTracker.track("User already authenticated");
        await signOut();
        return;
      }
      Logger.error("Error signing in with Google", { error });
      dispatch(setError("Failed to sign in"));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      EventTracker.track("User signed out");
      await signOutAuth({ callbackUrl: "/" });
      dispatch(clearUser());
      // localStorage.clear();
    } catch (error: any) {
      Logger.error("Error signing out", { error });
      dispatch(setError("Failed to sign out"));
      throw error;
    } finally {
      router.push("/");
    }
  }, []);

  const deleteUser = useCallback(async () => {
    try {
      EventTracker.track("User deleted");
      await axiosInstance.delete("/api/user");
      await signOutAuth({ callbackUrl: "/" });
      dispatch(clearUser());
      localStorage.clear();
      router.push("/");
    } catch (error: any) {
      Logger.error("Error deleting user", { error });
      dispatch(setError("Failed to delete user"));
      throw error;
    }
  }, []);

  const refreshUserMetadata = useCallback(async () => {
    try {
      await axiosInstance.post("/api/user/data/refresh");
    } catch (error: any) {
      Logger.error("Error refreshing user metadata", { error });
    }
  }, []);

  return {
    refreshUserMetadata,
    signInWithGoogle,
    deleteUser,
    signOut,
    loading,
  };
};

export default useAuth;
