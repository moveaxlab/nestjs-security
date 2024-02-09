import * as jwt from "jsonwebtoken";
import { JwtSecretOrIssuerMap } from "../security/secret.provider";

export function getIssuerPublicKey(
  jwtSecretOrIssuerMap: JwtSecretOrIssuerMap,
  tokenOrPayload: string | object | Buffer,
) {
  if (typeof jwtSecretOrIssuerMap === "string") {
    return jwtSecretOrIssuerMap;
  }

  if (typeof tokenOrPayload !== "string") {
    throw new Error("Unable to parse Token of type " + typeof tokenOrPayload);
  }

  const tokenPayload = tokenOrPayload as string;

  const token = jwt.decode(tokenPayload) as { [key: string]: string };

  const issuer = token["iss"] as string;
  const issuerMap = jwtSecretOrIssuerMap as { [issuer: string]: string };
  if (issuer === undefined || !(issuer in issuerMap)) {
    throw new Error("invalid or undefined issuer");
  }
  return issuerMap[issuer];
}
