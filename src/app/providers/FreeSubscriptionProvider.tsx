"use client";

import {
  selectAuth,
  updateUserPlan as updateUserPlanAction,
} from "@/lib/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { Logger } from "@/logger";
import { Plan } from "@prisma/client";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function FreeSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const { user } = useAppSelector(selectAuth);
  const [loading, setLoading] = useState(false);

  let code = searchParams.get("code");

  const handleFreeSubscription = async () => {
    debugger;
    code = code || localStorage.getItem("code");
    if (code) {
      try {
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
        debugger;
        if (error.response.status === 400) {
          toast.error("Invalid code - " + error.response.data.error);
        }
        Logger.error("Error creating free subscription:", error);
        // Keep the code in localStorage if there was an error
        // so we can try again later
      } finally {
        setLoading(false);
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
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );
  }

  return children;
}
