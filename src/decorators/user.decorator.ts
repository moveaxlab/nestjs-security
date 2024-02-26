import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getRequest } from "../utils";

/**
 * Injects the parsed access token for the current request.
 */
export const User = createParamDecorator((_, context: ExecutionContext) => {
  return getRequest(context).user;
});
