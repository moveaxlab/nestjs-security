import { Strategy } from "passport-custom";
import { PassportStrategy } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Request as ExtendedRequest, User } from "../utils/types";
import { ExtractJwt } from "passport-jwt";
import { SECURITY_CONFIG_INJECTION_KEY } from "../constants";
import { SecurityModuleHeaderOptions } from "./options";
import { FastifyRequest } from "fastify";

const accessTokenExtractor = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
]);

@Injectable()
export class HeaderJwtStrategy extends PassportStrategy(Strategy, "jwt") {
  private readonly logger = new Logger(HeaderJwtStrategy.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(SECURITY_CONFIG_INJECTION_KEY)
    private readonly options: SecurityModuleHeaderOptions,
  ) {
    super();
  }

  async validate<U extends User = User>(req: FastifyRequest): Promise<U> {
    const token = accessTokenExtractor(req);

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
