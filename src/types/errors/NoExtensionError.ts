export class NoExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoExtensionError";
  }
}
