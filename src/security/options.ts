import { JwtSecretOrIssuerMap } from "./secret.provider";

interface RedisOptions {
  host: string;
  port: number;
  password: string;
  tlsEnabled: boolean;
}

export interface SecurityModuleCookieOptions {
  type: "cookie";
  jwtSecret: JwtSecretOrIssuerMap;
  ignoreExpiration?: boolean;
  redis?: RedisOptions;
  cookieExpirationMilliseconds: number;
  cookieDomain: string;
  secure?: boolean;
  tokenConverter?: <U>(token: unknown) => U;
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  opaqueTokenCookieName: string;
}

export interface SecurityModuleHeaderOptions {
  type: "header";
  jwtSecret: JwtSecretOrIssuerMap;
  ignoreExpiration?: boolean;
  tokenConverter?: <U>(token: unknown) => U;
}

export type SecurityModuleOptions =
  | SecurityModuleCookieOptions
  | SecurityModuleHeaderOptions;
