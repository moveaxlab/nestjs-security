import { UnauthenticatedError } from "./unauthenticated.error";

export class TokenExpiredError extends UnauthenticatedError {
  constructor() {
    super("Token expired");
  }
}
