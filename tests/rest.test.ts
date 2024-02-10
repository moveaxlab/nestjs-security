import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Authenticated, CookieService, SecurityModule } from "../src";
import { Controller, Get, Post, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { sign } from "jsonwebtoken";
import fastifyCookie from "@fastify/cookie";

@Controller()
class TestController {
  constructor(private readonly cookieService: CookieService) {}

  @Post("/login")
  async login(@Res({ passthrough: true }) response: FastifyReply) {
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
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
}

let app: NestFastifyApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      SecurityModule.forRoot({
        type: "cookie",
        accessTokenHeaderKey: "access_token",
        cookieDomain: "localhost",
        cookieExpirationMilliseconds: 15 * 60 * 1000,
        jwtSecret: "secret",
        opaqueTokenHeaderKey: "opaque_token",
        refreshTokenHeaderKey: "refresh_token",
      }),
    ],
    controllers: [TestController],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    {
      logger: ["verbose", "debug", "log", "warn", "error", "fatal"],
    },
  );

  await app.register(fastifyCookie, {
    secret: "my-secret", // for cookies signature
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

it(`/GET cats`, async () => {
  const result = await app.inject({
    method: "POST",
    url: "/login",
  });
  expect(result.statusCode).toEqual(201);
  expect(result.cookies).toHaveLength(2);

  const cookies = result.cookies.reduce(
    (acc, val) => {
      acc[val.name] = val.value;
      return acc;
    },
    {} as { [k: string]: string },
  );
  const result2 = await app.inject({
    method: "GET",
    url: "/cats",
    cookies,
  });
  expect(result2.statusCode).toEqual(200);
});

afterAll(async () => {
  await app?.close();
});
