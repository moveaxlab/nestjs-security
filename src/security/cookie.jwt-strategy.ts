import { Strategy } from "passport-custom";
import { PassportStrategy } from "@nestjs/passport";
import { Redis } from "ioredis";
import { JwtService } from "@nestjs/jwt";
import {
  REDIS_INJECTION_KEY,
  SECURITY_CONFIG_INJECTION_KEY,
} from "../constants";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SecurityModuleCookieOptions } from "./options";
import { Request as ExtendedRequest, User } from "../utils/types";
import { ExtractJwt, JwtFromRequestFunction } from "passport-jwt";
import { FastifyRequest } from "fastify";
import "@fastify/cookie";
import { ModuleRef } from "@nestjs/core";

function extractFromCookie(cookie: string): JwtFromRequestFunction {
  return (req: FastifyRequest) => req.cookies[cookie] ?? null;
}

@Injectable()
export class CookieJwtStrategy
  extends PassportStrategy(Strategy, "jwt")
  implements OnModuleInit
{
  private readonly logger = new Logger(CookieJwtStrategy.name);

  private readonly opaqueTokenExtractor: JwtFromRequestFunction;

  private readonly accessTokenExtractor: JwtFromRequestFunction;

  private redis?: Redis;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly jwtService: JwtService,
    @Inject(SECURITY_CONFIG_INJECTION_KEY)
    private readonly options: SecurityModuleCookieOptions,
  ) {
    super();
    this.opaqueTokenExtractor = ExtractJwt.fromExtractors([
      extractFromCookie(this.options.opaqueTokenHeaderKey),
    ]);
    this.accessTokenExtractor = ExtractJwt.fromExtractors([
      extractFromCookie(this.options.accessTokenHeaderKey),
    ]);
  }

  onModuleInit() {
    if (this.options.redis) {
      this.redis = this.moduleRef.get(REDIS_INJECTION_KEY, { strict: true });
    }
  }

  async validate<U extends User = User>(req: FastifyRequest): Promise<U> {
    let token: string | null;

    const opaqueToken = this.opaqueTokenExtractor(req);

    if (this.redis && opaqueToken) {
      this.logger.debug(
        `Found opaque token ${opaqueToken} in request, retrieving access token`,
      );
      token = await this.redis.get(opaqueToken);
    } else {
      token = this.accessTokenExtractor(req);
    }

    if (!token) {
      this.logger.debug(`No access token found in request`);
      throw new Error("No auth token");
    }

    (req as ExtendedRequest).token = token;

    this.logger.debug(`Extracted access token ${token} from request`);

    const verifiedToken = await this.jwtService.verifyAsync(token, {
      ignoreExpiration: this.options.ignoreExpiration,
    });

    return this.options.tokenConverter?.(verifiedToken) ?? verifiedToken;
  }
}
