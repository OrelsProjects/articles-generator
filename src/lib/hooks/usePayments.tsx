import axiosInstance from "@/lib/axios-instance";
import { Logger } from "@/logger";
import { Product } from "@/types/payment";
import { loadStripe } from "@stripe/stripe-js";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setProducts } from "@/lib/features/products/productsSlice";
import { useRef, useState } from "react";
import { selectAuth, updateUserPlan } from "@/lib/features/auth/authSlice";
import { setCancelAt } from "@/lib/features/settings/settingsSlice";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { Plan } from "@prisma/client";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function usePayments() {
  const dispatch = useAppDispatch();
  const loadingProducts = useRef(false);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [referral] = useLocalStorage("referral", null);
  const { user } = useAppSelector(selectAuth);

  const getProducts = async () => {
    try {
      if (loadingProducts.current) {
        return;
      }
      loadingProducts.current = true;
      const response = await axiosInstance.get<Product[]>(
        "/api/stripe/products",
      );
      dispatch(setProducts(response.data));
      return response.data;
    } catch (error: any) {
      Logger.error("Error getting products", { error });
      throw error;
    } finally {
      loadingProducts.current = false;
    }
  };

  const validateCoupon = async (
    couponCode: string,
    plans: { name: string; price: number; interval: "month" | "year" }[],
  ) => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/coupon/${couponCode}/new-prices`,
        { plans },
      );
      return response.data.newPrices;
    } catch (error: any) {
      Logger.error("Error validating coupon", { error });
      throw error;
    }
  };

  const goToCheckout = async (
    interval: "month" | "year",
    plan: string,
    couponCode?: string,
  ) => {
    try {
      let affiliateId = null;
      try {
        Logger.info("Rewardful", { Rewardful });
        affiliateId = await Rewardful.referral;
        Logger.info("affiliateId", { affiliateId });
      } catch (error) {
        Logger.error("Error getting affiliate", { error });
      }
      const response = await axiosInstance.post<{ sessionId: string }>(
        "/api/stripe/checkout",
        {
          interval,
          plan,
          localReferral: referral,
          referralId: affiliateId,
          couponCode,
        },
      );
      Logger.info("response", { response: response.data });
      const stripe = await stripePromise;
      Logger.info("stripe", { stripe });
      const { error } = await stripe!.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      Logger.info("error", { error });
      if (error) {
        Logger.error("Error redirecting to checkout", { error });
        throw error;
      }
    } catch (error: any) {
      Logger.error("Error starting checkout", { error });
      throw error;
    }
  };

  const updateSubscription = async (
    plan: string,
    interval: "month" | "year",
  ) => {
    try {
      await axiosInstance.post<{
        success: boolean;
        data: {
          plan: Plan;
        };
      }>("/api/user/subscription/update", {
        plan,
        interval,
      });

      dispatch(updateUserPlan({ plan, interval }));
    } catch (error: any) {
      Logger.error("Failed to upgrade subscription", { error });
      throw error;
    }
  };

  /**
   * Purchase credits
   */
  const purchaseCredits = async (credits: number) => {
    if (loadingCredits) {
      return;
    }
    setLoadingCredits(true);
    try {
      const response = await axiosInstance.post(
        "/api/user/subscription/credits",
        {
          credits,
        },
      );
      Logger.info("Credits purchased successfully", { response });
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      if (error) {
        Logger.error("Error redirecting to checkout", { error });
        throw error;
      }
    } catch (error: any) {
      Logger.error("Failed to purchase credits", { error });
      throw error;
    } finally {
      setLoadingCredits(false);
    }
  };

  const verifySubscription = async () => {
    try {
      await axiosInstance.get("/api/user/subscription/verify");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const applyRetentionDiscount = async () => {
    try {
      await axiosInstance.post("/api/user/subscription/coupon/apply/retention");
      // This would normally implement the discount application logic
      Logger.info("Applying retention discount");
      return true;
    } catch (error) {
      Logger.error("Failed to apply retention discount", {
        error: String(error),
      });
      return false;
    }
  };

  /**
   * Uncancel user subscription
   */
  const uncancelSubscription = async () => {
    if (!user) {
      return;
    }
    try {
      await axiosInstance.post("/api/user/subscription/uncancel");
      Logger.info("Subscription uncanceled successfully");
      
      // Update Redux state to remove the cancellation date
      dispatch(setCancelAt(undefined));
    } catch (error: any) {
      Logger.error("Failed to uncancel subscription", { error });
      throw error;
    }
  };

  /**
   * Cancel user subscription in your backend
   */
  const cancelSubscription = async () => {
    if (!user) {
      return;
    }
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        endsAt: string;
      }>("/api/user/subscription/cancel");
      Logger.info("Subscription canceled successfully");
      
      // Update Redux state with the cancellation date
      dispatch(setCancelAt(new Date(response.data.endsAt)));
    } catch (error: any) {
      Logger.error("Failed to cancel subscription", { error });
      throw error;
    }
  };

  return {
    getProducts,
    goToCheckout,
    cancelSubscription,
    uncancelSubscription,
    updateSubscription,
    purchaseCredits,
    loadingCredits,
    verifySubscription,
    applyRetentionDiscount,
    validateCoupon,
  };
}
