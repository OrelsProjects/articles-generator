import axios from "axios";
import { Logger } from "@/logger";
import { Product } from "@/types/payment";
import { loadStripe } from "@stripe/stripe-js";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setProducts } from "@/lib/features/products/productsSlice";
import { useRef, useState } from "react";
import { selectAuth, updateUserPlan } from "@/lib/features/auth/authSlice";
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
      const response = await axios.get<Product[]>("/api/stripe/products");
      dispatch(setProducts(response.data));
      return response.data;
    } catch (error: any) {
      Logger.error("Error getting products", { error });
      throw error;
    } finally {
      loadingProducts.current = false;
    }
  };

  const goToCheckout = async (interval: "month" | "year", plan: string) => {
    try {
      let affiliate = null;
      try {
        affiliate = await Rewardful.affiliate;
      } catch (error) {
        Logger.error("Error getting affiliate", { error });
      }
      const response = await axios.post<{ sessionId: string }>(
        "/api/stripe/checkout",
        { interval, plan, localReferral: referral, referralId: affiliate?.id },
      );
      console.log("response", response.data);
      const stripe = await stripePromise;
      console.log("stripe", stripe);
      const { error } = await stripe!.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      console.log("error", error);
      if (error) {
        console.log("error", error);
        Logger.error("Error redirecting to checkout", { error });
        throw error;
      }
    } catch (error: any) {
      Logger.error("Error starting checkout", { error });
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
      await axios.post("/api/user/subscription/cancel");
      Logger.info("Subscription canceled successfully");
      window.location.reload();
    } catch (error: any) {
      Logger.error("Failed to cancel subscription", { error });
      throw error;
    }
  };

  const updateSubscription = async (
    plan: string,
    interval: "month" | "year",
  ) => {
    try {
      const response = await axios.post<{
        success: boolean;
        data: {
          plan: Plan;
        };
      }>("/api/user/subscription/update", {
        plan,
        interval,
      });

      dispatch(updateUserPlan(plan));
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
      const response = await axios.post("/api/user/subscription/credits", {
        credits,
      });
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
      await axios.get("/api/user/subscription/verify");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    getProducts,
    goToCheckout,
    cancelSubscription,
    updateSubscription,
    purchaseCredits,
    loadingCredits,
    verifySubscription,
  };
}
