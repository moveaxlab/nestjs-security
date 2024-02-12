import { ExecutionContext, ContextType } from "@nestjs/common";
import { Request } from "./types";

/**
 * Extracts the request object from the execution context.
 * Works for REST and GraphQL gateways.
 *
 * @param context the current execution context.
 */
export function getRequest(context: ExecutionContext): Request {
  switch (context.getType<"graphql" | ContextType>()) {
    case "graphql":
      // workaround to not rely on the graphql module directly
      return context.getArgs()[2].req;
    case "http":
      return context.switchToHttp().getRequest();
    default:
      throw new Error(`Unsupported context type: ${context.getType()}`);
  }
}
