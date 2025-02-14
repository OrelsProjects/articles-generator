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

export default function FreeSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const [loading, setLoading] = useState(false);

  const updateUserPlan = async () => {
    const code = localStorage.getItem("code");
    if (code) {
      try {
        setLoading(true);
        const response = await axios.post<{ plan: Plan }>(
          "/api/user/free-sub",
          { code },
        );
        Logger.info("User plan updated:", response.data);
        localStorage.removeItem("code");
        if (user) {
          dispatch(updateUserPlanAction(response.data.plan));
        }
      } catch (error: any) {
        Logger.error("Error updating user plan:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    updateUserPlan();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );
  }

  return children;
}
