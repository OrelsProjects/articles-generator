"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function FreeSubscriptionProvider() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code");

  const updateUserPlan = async () => {
    if (code) {
      try {
        const response = await axios.post("/api/user/free-sub", { code });
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    updateUserPlan();
  }, [code]);

  return null;
}
