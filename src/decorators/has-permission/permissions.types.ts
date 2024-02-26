import { SetMetadata } from "@nestjs/common";
import { PERMISSIONS_METADATA_KEY } from "../../constants";

export const PermissionsTypes = (permission: string) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permission);
