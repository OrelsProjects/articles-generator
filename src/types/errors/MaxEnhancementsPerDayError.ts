export class MaxEnhancementsPerDayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaxEnhancementsPerDayError";
  }
}
