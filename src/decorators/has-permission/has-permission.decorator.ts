import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsTypes } from './permissions.types';
import { AuthGuard } from "../auth.guard";

/**
 * Allows only requests from users with a token in the given types.
 *
 * @param permission list of allowed token types
 */
export function HasPermission(permission: string) {
  return applyDecorators(
    UseGuards(AuthGuard, PermissionsGuard),
    PermissionsTypes(permission)
  );
}
