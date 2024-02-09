import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getRequest } from "../utils";

/**
 * Injects the access token for the current request.
 *
 * The access token is a JWT string, and must be parsed.
 */
export const AccessToken = createParamDecorator(
  (_, context: ExecutionContext) => {
    return getRequest(context).token;
  },
);
