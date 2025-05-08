// A function that transforms a subscriber count string into a number
// Examples: 17k subscribers, 4.3k subscribers, 438 subscribers

export const transformSubscriberCount = (subscriberCount: string): number => {
  // trim, lowercase and strip commas/extra crap
  const cleaned = subscriberCount.trim().toLowerCase().replace(/,/g, "");

  // capture number part and optional suffix (k or m)
  const match = cleaned.match(/^([\d.]+)([km]?)/);
  if (!match) return 0; // couldn’t parse? return 0

  const [, numStr, suffix] = match;
  let num = parseFloat(numStr);

  if (suffix === "k") num *= 1_000;
  else if (suffix === "m") num *= 1_000_000;

  return Math.round(num);
};