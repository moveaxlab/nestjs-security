import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Dependencies,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getRequest } from "../utils";
import { TOKEN_TYPES_METADATA_KEY } from "../constants";

@Dependencies(Reflector)
@Injectable()
export class TokenTypeGuard implements CanActivate {
  private readonly logger = new Logger(TokenTypeGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const user = getRequest(context).user;

    if (!user?.tokenType) {
      return false;
    }

    const allowedTokenTypes = (this.reflector.get(
      TOKEN_TYPES_METADATA_KEY,
      context.getHandler(),
    ) ||
      this.reflector.get(
        TOKEN_TYPES_METADATA_KEY,
        context.getClass(),
      )) as string[];

    this.logger.debug(
      `Allowed token types are: [${allowedTokenTypes.join(", ")}]`,
    );

    return allowedTokenTypes.includes(user.tokenType);
  }
}
