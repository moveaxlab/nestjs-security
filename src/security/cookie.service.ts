import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  REDIS_INJECTION_KEY,
  SECURITY_CONFIG_INJECTION_KEY,
} from "../constants";
import moment from "moment";
import { Redis } from "ioredis";
import { randomUUID } from "crypto";
import { SecurityModuleCookieOptions } from "./options";
import { FastifyReply, FastifyRequest } from "fastify";
import { ModuleRef } from "@nestjs/core";

@Injectable()
export class CookieService implements OnModuleInit {
  private readonly logger = new Logger(CookieService.name);

  private redis?: Redis;

  constructor(
    @Inject(SECURITY_CONFIG_INJECTION_KEY)
    private readonly options: SecurityModuleCookieOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    if (this.options.redis) {
      this.redis = this.moduleRef.get(REDIS_INJECTION_KEY, { strict: true });
    }
  }

  async setCookies(
    response: FastifyReply,
    accessToken: string,
    refreshToken: string,
  ) {
    const options = {
      domain: this.options.cookieDomain,
      expires: moment()
        .add(this.options.cookieExpirationMilliseconds, "milliseconds")
        .toDate(),
      httpOnly: true,
      secure: this.options.secure,
      signed: false,
    };

    if (this.redis) {
      const opaqueToken = randomUUID();

      const exp = Math.floor(this.options.cookieExpirationMilliseconds / 1000);

      this.logger.debug(
        `Storing access token ${accessToken} on redis with opaque token ${opaqueToken} for ${exp} seconds`,
      );
      await this.redis.setex(opaqueToken, exp, accessToken);
      response.cookie(this.options.opaqueTokenHeaderKey, opaqueToken, options);
    } else {
      response.cookie(this.options.accessTokenHeaderKey, accessToken, options);
    }

    response.cookie(this.options.refreshTokenHeaderKey, refreshToken, options);
  }

  async clearCookies(request: FastifyRequest, response: FastifyReply) {
    const options = {
      domain: this.options.cookieDomain,
    };

    const opaqueToken = request.cookies[this.options.opaqueTokenHeaderKey];

    if (this.redis && opaqueToken) {
      this.logger.debug(`Deleting opaque token ${opaqueToken} from redis`);
      await this.redis.del(opaqueToken);
    }

    response.clearCookie(this.options.accessTokenHeaderKey, options);
    response.clearCookie(this.options.opaqueTokenHeaderKey, options);
    response.clearCookie(this.options.refreshTokenHeaderKey, options);
  }
}
