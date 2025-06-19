import { useState, useRef, useEffect   } from "react";
import { useAppSelector } from "./redux";
import { selectAuth } from "../features/auth/authSlice";
import axiosInstance from "@/lib/axios-instance";
import { Coupon } from "@/types/payment";
import { Plan } from "@prisma/client";
import { Logger } from "@/logger";

interface BillingInfo {
  plan: Plan | null;
  nextBillingDate: Date | null;
  interval: "month" | "year" | null;
  nextPaymentAmount: number | null; // Final amount after discount (in cents)
  originalAmount: number | null; // Original price before discount (in cents)
  discountedAmount: number | null; // Amount after discount applied (in cents)
  coupon: (Coupon & { isValid: boolean }) | null;
}

export const useBilling = () => {
  const { user } = useAppSelector(selectAuth);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const fetchBillingInfo = async () => {
    if (!user) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get<BillingInfo>("/api/user/subscription/billing");
      
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
      Logger.error("Error fetching billing information:", { error: String(err) });
      setError("Failed to load billing information");
    } finally {
      loadingRef.current = false;
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
    fetchBillingInfo,
    refreshBillingInfo: fetchBillingInfo
  };
}; 