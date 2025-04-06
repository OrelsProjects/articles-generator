export class NoSubstackCookiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoSubstackCookiesError";
  }
}
