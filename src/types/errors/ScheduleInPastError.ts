export class ScheduleInPastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleInPastError";
  }
}
