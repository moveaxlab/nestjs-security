import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Dependencies,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getRequest } from "../../utils";
import { PERMISSIONS_METADATA_KEY } from "../../constants";

@Dependencies(Reflector)
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const user = getRequest(context).user;

    if (!user?.permissions) {
      return false;
    }

    const permission = (this.reflector.get(
      PERMISSIONS_METADATA_KEY,
      context.getHandler(),
    ) ||
      this.reflector.get(
        PERMISSIONS_METADATA_KEY,
        context.getClass(),
      )) as string;
    if (permission === "*") {
      this.logger.debug("No specific permission required");
      return true;
    }

    return user.permissions.includes(permission);
  }
}
