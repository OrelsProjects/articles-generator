export interface HourlyStats {
  userId: number;
  hourOfDayUTC: string;
  adjustedAvgReaction: number;
}

export interface Streak {
  date: Date;
  notes: number;
}
