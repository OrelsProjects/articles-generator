// Declaration file for Rewardful
interface RewardfulInstance {
  referral: string | null;
  affiliate: RewardfulAffiliate | null;
  // Add other properties as needed based on the Rewardful API
}

interface RewardfulAffiliate {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  token: string;
}

declare global {
  interface Window {
    Rewardful: RewardfulInstance;
  }

  function rewardful(event: string, callback: () => void): void;
  var Rewardful: RewardfulInstance;
}

export {};
