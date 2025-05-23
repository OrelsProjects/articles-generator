export interface HourlyStats {
  userId: number;
  hourOfDayUTC: string;
  adjustedAvgReaction: number;
}

export interface Streak {
  month: string;
  day: string;
  year: string;
  notes: number;
}

export type ReactionInterval = "day" | "week" | "month" | "year";

export type NoteReactions = {
  period: string; // e.g. "2025-01-01", "2025-01-02", etc.
  total: number;
};
