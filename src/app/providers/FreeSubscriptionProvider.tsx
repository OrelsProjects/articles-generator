"use client";

import axios from "axios";
import { useEffect } from "react";

export default function FreeSubscriptionProvider() {
  const code = localStorage.getItem("code");

  const updateUserPlan = async () => {
    if (code) {
      try {
        const response = await axios.post("/api/user/free-sub", { code });
        console.log(response.data);
        localStorage.removeItem("code");
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
