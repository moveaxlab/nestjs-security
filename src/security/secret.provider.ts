import { JwtSecretRequestType } from "@nestjs/jwt";
import { getIssuerPublicKey } from "../utils";

// The JwtSecret may be directly the string,
// or an object that maps the issuer name to the actual secret
export type JwtSecretOrIssuerMap = string | { [issuer: string]: string };

export type SecretOrKeyProvider = (
  requestType: JwtSecretRequestType,
  tokenOrPayload: string | object | Buffer,
) => string;

export function jwtModuleSecretOrKeyProvider(
  jwtSecretOrIssuerMap: JwtSecretOrIssuerMap,
): SecretOrKeyProvider {
  return (_request: unknown, tokenOrPayload: string | object | Buffer) => {
    return getIssuerPublicKey(jwtSecretOrIssuerMap, tokenOrPayload);
  };
}
