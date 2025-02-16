export class MaxIdeasPerDayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaxIdeasPerDayError";
  }
}
