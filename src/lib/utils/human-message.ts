import { GenerateIdeasNoPlanError } from "@/types/errors/GenerateIdeasNoPlanError";
import { IdeasBeingGeneratedError } from "@/types/errors/IdeasBeingGeneratedError";
import { MaxEnhancementsPerDayError } from "@/types/errors/MaxEnhancementsPerDayError";
import { MaxIdeasPerDayError } from "@/types/errors/MaxIdeasPerDayError";
import { MaxRefinementsPerDayError } from "@/types/errors/MaxRefinementsPerDayError";
import { Model429Error } from "@/types/errors/Model429Error";
import { NoCookiesError } from "@/types/errors/NoCookiesError";
import { NoExtensionError } from "@/types/errors/NoExtensionError";
import { NoSubstackCookiesError } from "@/types/errors/NoSubstackCookiesError";
import { PublicationNotFoundError } from "@/types/errors/PublicationNotFoundError";
import { ScheduleFailedEmptyNoteBodyError } from "@/types/errors/ScheduleFailedEmptyNoteBodyError";
import { ScheduleInPastError } from "@/types/errors/ScheduleInPastError";
import { UserNotFoundError } from "@/types/errors/UserNotFoundError";
import { ScheduleLimitExceededError } from "@/types/errors/ScheduleLimitExceededError";
import { ScheduleNotFoundError } from "@/types/errors/ScheduleNotFoundError";

export function humanMessage(error: any, fallbackMessage?: string) {
  if (error instanceof GenerateIdeasNoPlanError) {
    return "No plan found";
  }
  if (error instanceof IdeasBeingGeneratedError) {
    return "Ideas are being generated";
  }
  if (error instanceof ScheduleLimitExceededError) {
    return "You have reached the maximum number of scheduled notes";
  }
  if (error instanceof ScheduleInPastError) {
    return "Scheduled time cannot be in the past";
  }
  if (error instanceof MaxEnhancementsPerDayError) {
    return "You have reached the maximum number of enhancements for today";
  }
  if (error instanceof MaxIdeasPerDayError) {
    return "You have reached the maximum number of ideas for today";
  }
  if (error instanceof MaxRefinementsPerDayError) {
    return "You have reached the maximum number of refinements for today";
  }
  if (error instanceof Model429Error) {
    return "Our AI service is currently experiencing high demand. Please try again later";
  }
  if (error instanceof NoCookiesError) {
    return "No cookies found. Please make sure cookies are enabled in your browser";
  }
  if (error instanceof NoExtensionError) {
    return "Browser extension is required but not found";
  }
  if (error instanceof NoSubstackCookiesError) {
    return "Substack authentication required. Please log in to your Substack account";
  }
  if (error instanceof PublicationNotFoundError) {
    return "Publication not found";
  }
  if (error instanceof ScheduleFailedEmptyNoteBodyError) {
    return "Cannot schedule a note with empty content";
  }
  if (error instanceof UserNotFoundError) {
    return "User not found";
  }
  if (error instanceof ScheduleNotFoundError) {
    return "Schedule not found";
  }

  // Default case for unhandled errors
  return fallbackMessage || "An unexpected error occurred";
}
