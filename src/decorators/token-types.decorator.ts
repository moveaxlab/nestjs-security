import { SetMetadata } from "@nestjs/common";
import { TOKEN_TYPES_METADATA_KEY } from "../constants";

export const TokenTypes = (...tokenTypes: string[]) =>
  SetMetadata(TOKEN_TYPES_METADATA_KEY, tokenTypes);
