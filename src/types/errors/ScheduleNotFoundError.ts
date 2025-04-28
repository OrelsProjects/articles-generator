export class ScheduleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleNotFoundError";
  }
}
