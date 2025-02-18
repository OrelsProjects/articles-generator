export class MaxRefinementsPerDayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaxRefinementsPerDayError";
  }
}
