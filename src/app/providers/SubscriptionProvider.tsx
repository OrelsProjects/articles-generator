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
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleVerifySubscription = async () => {
    try {
      await verifySubscription();
      setHasSubscription(true);
    } catch (error) {
      console.error(error);
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

  if (!hasSubscription) {
    redirect("/pricing?onboarding=true");
  }

  return <>{children}</>;
}
