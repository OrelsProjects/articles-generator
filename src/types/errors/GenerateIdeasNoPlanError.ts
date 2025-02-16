export class GenerateIdeasNoPlanError extends Error {
  constructor(message?: string) {
    super(message || "You don't have a plan to generate ideas");
    this.name = "GenerateIdeasNoPlanError";
  }
}
