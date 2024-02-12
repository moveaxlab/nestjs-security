import { LightMyRequestResponse } from "fastify";

export function parseFastifyCookies(
  cookies: LightMyRequestResponse["cookies"],
): { [key: string]: string } {
  return cookies.reduce(
    (res, { name, value }) => {
      res[name] = value;
      return res;
    },
    {} as { [key: string]: string },
  );
}

export function parseExpressCookies(cookies: string[]): {
  [key: string]: string;
} {
  return cookies.reduce(
    (res, cookie) => {
      const [name, value] = cookie.split(";")[0].split("=");
      res[name] = value;
      return res;
    },
    {} as { [key: string]: string },
  );
}
