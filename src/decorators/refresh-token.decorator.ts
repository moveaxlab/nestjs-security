import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getRequest } from "../utils";

/**
 * Injects the refresh token for the current request.
 * Use in conjunction with [[RefreshCookieInterceptor]].
 *
 * The refresh token is an opaque string.
 */
export const RefreshToken = createParamDecorator(
  (_data, context: ExecutionContext) => {
    return getRequest(context).refreshToken;
  },
);
