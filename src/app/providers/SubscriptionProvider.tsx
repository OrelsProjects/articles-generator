import Loading from "@/components/ui/loading";
import axios from "axios";
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
        <Loading spinnerClassName="h-16 w-16" />
      </div>
    );
  }

  if (!hasSubscription) {
    redirect("/pricing?onboarding=true");
  }

  return <>{children}</>;
}
