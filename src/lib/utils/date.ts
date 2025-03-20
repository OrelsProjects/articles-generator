import { DateRange } from "react-day-picker";

export function parseDateRange(dateRange: string): DateRange {
  const [from, to] = dateRange.split(" ~ ");
  return { from: new Date(from), to: new Date(to) };
}
