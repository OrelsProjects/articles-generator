"use client";

import { selectAuth } from "@/lib/features/auth/authSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { Logger } from "@/logger";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "@/components/ui/loading";

export default function FreeSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAppSelector(selectAuth);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  let code = searchParams.get("code");

  const handleFreeSubscription = async () => {
    code = code || localStorage.getItem("code");
    if (loadingRef.current) return;
    if (code) {
      try {
        loadingRef.current = true;
        setLoading(true);
        const response = await axios.post<{
          success: boolean;
          sessionId: string;
          url: string;
        }>("/api/user/free-sub", { code });

        Logger.info("Free subscription checkout created:", response.data);
        localStorage.removeItem("code");

        // If we have a checkout URL, redirect the user to complete the process
        if (response.data.url) {
          // Remove the code from localStorage before redirecting
          localStorage.removeItem("code");
          // Redirect to the Stripe Checkout page using window.location for a full page navigation
          window.location.href = response.data.url;
          return;
        } else {
          window.location.href = "/home";
        }

        // If no URL is returned (shouldn't happen with new implementation)
      } catch (error: any) {
        if (error.response.status === 400) {
          if (pathname === "/login") {
            toast.error("Invalid code - " + error.response.data.error);
          }
        }
        Logger.error("Error creating free subscription:", error);
        // Keep the code in localStorage if there was an error
        // so we can try again later
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (user || code) {
      handleFreeSubscription();
    }
  }, [user, code]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loading spinnerClassName="h-16 w-16" />
      </div>
    );
  }

  return children;
}
