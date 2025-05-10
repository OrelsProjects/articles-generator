import Loading from "@/components/ui/loading";
import usePayments from "@/lib/hooks/usePayments";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { verifySubscription } = usePayments();
  const [hasSubscription, setHasSubscription] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [loading, setLoading] = useState(true);

  const handleVerifySubscription = async () => {
    try {
      await verifySubscription();
      setHasSubscription("success");
    } catch (error) {
      setHasSubscription("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleVerifySubscription();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loading spinnerClassName="h-16 w-16" />
      </div>
    );
  }

  if (hasSubscription === "error") {
    redirect("/pricing?onboarding=true");
  }

  return <>{children}</>;
}
