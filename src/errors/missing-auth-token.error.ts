import { UnauthenticatedError } from "./unauthenticated.error";

export class MissingAuthTokenError extends UnauthenticatedError {
  constructor() {
    super("Missing auth token");
  }
}
