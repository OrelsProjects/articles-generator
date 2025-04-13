export class NoCookiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoCookiesError";
  }
}
