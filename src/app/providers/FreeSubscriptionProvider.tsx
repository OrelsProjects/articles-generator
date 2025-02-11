"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function FreeSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  const updateUserPlan = async () => {
    const code = localStorage.getItem("code");
    if (code) {
      try {
        setLoading(true);
        const response = await axios.post("/api/user/free-sub", { code });
        console.log(response.data);
        localStorage.removeItem("code");
      } catch (error) {
        console.error(error);
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
