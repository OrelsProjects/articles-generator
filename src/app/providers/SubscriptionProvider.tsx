import axios from "axios";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifySubscription = async () => {
    try {
      await axios.get("/api/user/subscription/verify");
      setHasSubscription(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySubscription();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSubscription) {
    redirect("/pricing");
  }

  return <>{children}</>;
}
