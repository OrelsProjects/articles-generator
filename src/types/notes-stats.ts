import { NotesComments } from "../../prisma/generated/articles";

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
  totalClicks: IntervalStats[];
  totalFollows: IntervalStats[];
  totalPaidSubscriptions: IntervalStats[];
  totalFreeSubscriptions: IntervalStats[];
  totalArr: IntervalStats[];
  totalShareClicks: IntervalStats[];
  engagementTotals?: {
    follows: number;
    freeSubscriptions: number;
    paidSubscriptions: number;
  };
};

export interface NoteWithEngagementStats {
  commentId: string;
  body: string;
  date: Date;
  handle: string;
  name: string;
  photoUrl: string;
  reactionCount: number;
  commentsCount: number;
  restacks: number;

  totalClicks: number;
  totalFollows: number;
  totalPaidSubscriptions: number;
  totalFreeSubscriptions: number;
  totalArr: number;
  totalShareClicks: number;
}
