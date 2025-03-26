import axios from "axios";
import { Logger } from "@/logger";
import { Product } from "@/types/payment";
import { loadStripe } from "@stripe/stripe-js";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setProducts } from "@/lib/features/products/productsSlice";
import { useRef } from "react";
import { selectAuth } from "@/lib/features/auth/authSlice";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function usePayments() {
  const dispatch = useAppDispatch();
  const loadingProducts = useRef(false);
  const [referral, setReferral] = useLocalStorage("referral", null);
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
      const response = await axios.post<{ sessionId: string }>(
        "/api/stripe/checkout",
        { interval, plan, referral },
      );
      console.log("response", response.data);
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      if (error) {
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
      await axios.post("/api/stripe/subscription/cancel", {
        userId: user.userId,
      });
      Logger.info("Subscription canceled successfully");
      window.location.reload();
    } catch (error: any) {
      Logger.error("Failed to cancel subscription", { error });
      throw error;
    }
  };

  /**
   * Upgrade subscription (monthly → yearly)
   */
  const upgradeSubscription = async (userId: string) => {
    try {
      const resp = await axios.post("/api/stripe/subscription/upgrade", {
        userId,
      });
      Logger.info("Upgrade response", resp.data);
      window.location.reload();
    } catch (error: any) {
      Logger.error("Failed to upgrade subscription", { error });
      throw error;
    }
  };

  return {
    getProducts,
    goToCheckout,
    cancelSubscription,
    upgradeSubscription,
  };
}
