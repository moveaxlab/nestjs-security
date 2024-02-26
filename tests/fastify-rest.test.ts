import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
  Authenticated,
  CookieService,
  HasPermission,
  SecurityModule,
} from "../src";
import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { sign } from "jsonwebtoken";
import fastifyCookie from "@fastify/cookie";
import { parseFastifyCookies } from "./utils";

@Controller()
class TestController {
  constructor(private readonly cookieService: CookieService) {}

  @Post("/login")
  async login(@Res({ passthrough: true }) response: FastifyReply) {
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
        permissions: ["dogs.read"],
      },
      "secret",
    );
    const refreshToken = "refresh";
    await this.cookieService.setCookies(response, accessToken, refreshToken);
  }

  @Get("/cats")
  @Authenticated("dog")
  async cats() {
    return {
      hello: "world",
    };
  }

  @Get("/dogs")
  @HasPermission("dogs.read")
  async dogs() {
    return {
      hello: "world",
    };
  }

  @Post("/logout")
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    await this.cookieService.clearCookies(request, response);
  }
}

let app: NestFastifyApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      SecurityModule.forRoot({
        type: "cookie",
        accessTokenCookieName: "access_token",
        cookieDomain: "localhost",
        cookieExpirationMilliseconds: 15 * 60 * 1000,
        jwtSecret: "secret",
        opaqueTokenCookieName: "opaque_token",
        refreshTokenCookieName: "refresh_token",
      }),
    ],
    controllers: [TestController],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.register(fastifyCookie);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

it(`performs login, query, and logout`, async () => {
  const loginResult = await app.inject({
    method: "POST",
    url: "/login",
  });
  expect(loginResult.statusCode).toEqual(201);
  expect(loginResult.cookies).toHaveLength(2);

  const cookies = parseFastifyCookies(loginResult.cookies);
  const queryResult = await app.inject({
    method: "GET",
    url: "/cats",
    cookies,
  });
  expect(queryResult.statusCode).toEqual(200);

  const queryResultDogs = await app.inject({
    method: "GET",
    url: "/dogs",
    cookies,
  });
  expect(queryResultDogs.statusCode).toEqual(200);

  const logoutResult = await app.inject({
    method: "POST",
    url: "/logout",
    cookies,
  });
  expect(logoutResult.statusCode).toEqual(201);
  expect(logoutResult.cookies).toHaveLength(3);
  logoutResult.cookies.forEach((cookie) => {
    expect(cookie.value).toEqual("");
  });
});

afterAll(async () => {
  await app?.close();
});
