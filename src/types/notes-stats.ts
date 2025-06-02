import { NotesComments } from "../../prisma/generated/articles";
import { Note } from "@/types/note";

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

export interface IntervalStats {
  period: string;
  total: number;
  noteId?: string;
}

export interface NoteStats {
  reactions: IntervalStats[];
  restacks: IntervalStats[];
  comments: IntervalStats[];
  totalClicks: IntervalStats[];
  totalFollows: IntervalStats[];
  totalPaidSubscriptions: IntervalStats[];
  totalFreeSubscriptions: IntervalStats[];
  totalArr: IntervalStats[];
  totalShareClicks: IntervalStats[];
  engagementTotals: {
    reactions: number;
    restacks: number;
    comments: number;
    clicks: number;
    follows: number;
    paidSubscriptions: number;
    freeSubscriptions: number;
  };
  notes: (Note & { reactionCount?: number })[];
}

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
