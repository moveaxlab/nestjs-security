import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { getRequest } from "../utils";
import { MissingRefreshTokenError } from "../errors";
import { SECURITY_CONFIG_INJECTION_KEY } from "../constants";
import { SecurityModuleCookieOptions } from "../security/options";

/**
 * Extracts the refresh token from the request cookies.
 * Use only if [[SecurityModule]] is configured to use cookies.
 */
@Injectable()
export class RefreshCookieInterceptor implements NestInterceptor {
  constructor(
    @Inject(SECURITY_CONFIG_INJECTION_KEY)
    private readonly options: SecurityModuleCookieOptions,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = getRequest(context);

    const refreshToken = req?.cookies[this.options.refreshTokenHeaderKey];

    if (!refreshToken) {
      throw new MissingRefreshTokenError();
    }

    req.refreshToken = refreshToken;

    return next.handle();
  }
}
