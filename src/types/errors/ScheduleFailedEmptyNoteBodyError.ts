export class ScheduleFailedEmptyNoteBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleFailedEmptyNoteBodyError";
  }
}
