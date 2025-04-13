import { DateRange } from "react-day-picker";

export function parseDateRange(dateRange: string): DateRange {
  const [from, to] = dateRange.split(" ~ ");
  return { from: new Date(from), to: new Date(to) };
}

export function toMilis(date: number | string | Date) {
  // check if date is in seconds
  if (typeof date === "number" && date < 10000000000) {
    return date * 1000;
  }
  if (typeof date === "string") {
    return new Date(date).getTime();
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  return date;
}
