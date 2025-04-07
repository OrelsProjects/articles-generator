// Declaration file for Rewardful
interface RewardfulInstance {
  referral: string | null;
  // Add other properties as needed based on the Rewardful API
}

declare global {
  interface Window {
    Rewardful: RewardfulInstance;
  }

  function rewardful(event: string, callback: () => void): void;
  var Rewardful: RewardfulInstance;
}

export {};
