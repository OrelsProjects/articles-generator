"use client";

import { signIn, signOut as signOutAuth } from "next-auth/react";
import { useCallback, useState } from "react";
import { clearUser, setError } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { EventTracker } from "@/eventTracker";
import { Logger } from "@/logger";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

const useAuth = () => {
  const searchParams = useSearchParams();
  const router = useCustomRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirect = new URL(`${window.location.origin}/onboarding`);

      // preserve query params
      searchParams.forEach((val, key) => {
        if (!redirect.searchParams.has(key)) {
          redirect.searchParams.append(key, val);
        }
      });
      setLoading(true);
      await signIn("google", {
        redirect: true,
        callbackUrl: redirect.toString(),
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
      localStorage.clear();
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
      await axios.delete("/api/user");
      await signOutAuth();
      dispatch(clearUser());
      localStorage.clear();
    } catch (error: any) {
      Logger.error("Error deleting user", { error });
      dispatch(setError("Failed to delete user"));
      throw error;
    } finally {
      router.push("/");
    }
  }, []);

  return {
    signInWithGoogle,
    deleteUser,
    signOut,
    loading,
  };
};

export default useAuth;
