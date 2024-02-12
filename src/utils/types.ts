export interface User {
  tokenType?: string;
}

export interface Request<U extends User = User> {
  token?: string;
  refreshToken?: string;
  user?: U;
  cookies?: { [key: string]: string | undefined };
}

export interface SetCookieOptions {
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  path?: string;
  signed?: boolean;
}

export interface ClearCookieOptions {
  domain?: string;
}

export interface Response {
  cookie: (name: string, value: string, options?: SetCookieOptions) => void;
  clearCookie: (name: string, options?: ClearCookieOptions) => void;
}

export interface ContextType<U extends User = User> {
  req: Request<U>;
  cache: Map<string, unknown>;
}
