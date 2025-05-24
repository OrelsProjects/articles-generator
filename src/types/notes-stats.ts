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

export type IntervalStats = {
  period: string; // e.g. "2025-01-01", "2025-01-02", etc.
  total: number;
};

export type NoteStats = {
  reactions: IntervalStats[];
  restacks: IntervalStats[];
  comments: IntervalStats[];
};
