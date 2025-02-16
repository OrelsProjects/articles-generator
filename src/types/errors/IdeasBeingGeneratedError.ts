export class IdeasBeingGeneratedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdeasBeingGeneratedError";
  }
}
