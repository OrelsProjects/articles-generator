export class ScheduleLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleLimitExceededError";
  }
}
