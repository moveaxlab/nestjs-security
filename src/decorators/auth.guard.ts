import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { AuthGuard as BaseAuthGuard } from "@nestjs/passport";
import { getRequest } from "../utils";
import {
  MalformedTokenError,
  TokenExpiredError,
  MissingAuthTokenError,
} from "../errors";

@Injectable()
export class AuthGuard extends BaseAuthGuard("jwt") {
  private readonly logger = new Logger(AuthGuard.name);

  getRequest(context: ExecutionContext) {
    return getRequest(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest<U>(err: any, user: U): U {
    if (err) {
      this.logger.warn(`Error during auth: ${err}`);
      switch (err.name) {
        case "TokenExpiredError":
          throw new TokenExpiredError();
        case "JsonWebTokenError":
          throw new MalformedTokenError();
      }
      switch (err.message) {
        case "No auth token":
          throw new MissingAuthTokenError();
        default:
          throw new Error(err.message);
      }
    }
    return user;
  }
}
