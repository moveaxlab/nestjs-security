export class MissingRefreshTokenError extends Error {
  constructor() {
    super("Missing refresh token");
  }
}
