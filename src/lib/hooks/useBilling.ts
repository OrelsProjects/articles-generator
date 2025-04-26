import { useState, useEffect } from "react";
import { useAppSelector } from "./redux";
import { selectAuth } from "../features/auth/authSlice";
import axios from "axios";
import { Coupon } from "@/types/payment";
import { Plan } from "@prisma/client";

interface BillingInfo {
  plan: Plan | null;
  nextBillingDate: Date | null;
  interval: "month" | "year" | null;
  coupon: (Coupon & { isValid: boolean }) | null;
}

export const useBilling = () => {
  const { user } = useAppSelector(selectAuth);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<BillingInfo>("/api/user/subscription/billing");
      
      // Convert string date to Date object if it exists
      let data = response.data;
      if (data.nextBillingDate) {
        data = {
          ...data,
          nextBillingDate: new Date(data.nextBillingDate)
        };
      }
      
      setBillingInfo(data);
    } catch (err) {
      console.error("Error fetching billing information:", err);
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBillingInfo();
    }
  }, [user]);

  return {
    billingInfo,
    loading,
    error,
    refreshBillingInfo: fetchBillingInfo
  };
}; 