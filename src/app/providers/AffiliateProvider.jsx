import { useEffect } from "react";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

export default function AffiliateProvider({ children }) {
  const [, setReferral] = useLocalStorage("referral", null);

  useEffect(() => {
    rewardful("ready", function () {
      setReferral(Rewardful.referral);
    });
  }, []);

  return children;
}
