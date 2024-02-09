import { applyDecorators, UseGuards } from "@nestjs/common";
import { TokenTypes } from "./token-types.decorator";
import { AuthGuard } from "./auth.guard";
import { TokenTypeGuard } from "./token-type.guard";

/**
 * Allows only requests from users with a token in the given types.
 *
 * @param tokenTypes list of allowed token types
 */
export function Authenticated(...tokenTypes: string[]) {
  return applyDecorators(
    UseGuards(AuthGuard, TokenTypeGuard),
    TokenTypes(...tokenTypes),
  );
}
