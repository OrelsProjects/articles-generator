export class ScheduleExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleExistsError";
  }
}
