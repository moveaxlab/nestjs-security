import { UnauthenticatedError } from "./unauthenticated.error";

export class MalformedTokenError extends UnauthenticatedError {
  constructor() {
    super("Malformed JWT token");
  }
}
