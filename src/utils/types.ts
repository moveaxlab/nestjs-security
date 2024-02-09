import { FastifyRequest } from "fastify";
import "@fastify/cookie";

export interface User {
  tokenType: string;
}

export interface Request<U extends User = User> extends FastifyRequest {
  token?: string;
  refreshToken?: string;
  user?: U;
}

export interface ContextType<U extends User = User> {
  req: Request<U>;
  cache: Map<string, unknown>;
}
