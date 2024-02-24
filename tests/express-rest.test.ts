import { Test } from "@nestjs/testing";
import request from "supertest";
import { Authenticated, CookieService, HasPermission, SecurityModule } from "../src";
import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import { parseExpressCookies } from "./utils";
import { Request, Response } from "express";
import { NestApplication } from "@nestjs/core";
import cookieParser from "cookie-parser";

@Controller()
class TestController {
  constructor(private readonly cookieService: CookieService) {}

  @Post("/login")
  async login(@Res({ passthrough: true }) response: Response) {
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
        permissions: [
          "mouse.read"
        ]
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
  @Get("/mouse")
  @HasPermission("mouse.read")
  async mouse() {
    return {
      hello: "squit",
    };
  }


  @Post("/logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.cookieService.clearCookies(request, response);
  }
}

let app: NestApplication;

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

  app = moduleRef.createNestApplication<NestApplication>();

  app.use(cookieParser());

  await app.init();
});

it(`performs login, query, and logout`, async () => {
  const loginResult = await request(app.getHttpServer()).post("/login");
  expect(loginResult.statusCode).toEqual(201);
  expect(loginResult.get("Set-Cookie")).toHaveLength(2);

  const queryResult = await request(app.getHttpServer())
    .get("/cats")
    .set("Cookie", loginResult.get("Set-Cookie"));
  expect(queryResult.statusCode).toEqual(200);

  const permissionQueryResult = await request(app.getHttpServer())
    .get("/mouse")
    .set("Cookie", loginResult.get("Set-Cookie"));
  expect(permissionQueryResult.statusCode).toEqual(200);

  const logoutResult = await request(app.getHttpServer())
    .post("/logout")
    .set("Cookie", loginResult.get("Set-cookie"))
    .send({});
  expect(logoutResult.statusCode).toEqual(201);
  expect(logoutResult.get("Set-Cookie")).toHaveLength(3);
  Object.entries(parseExpressCookies(logoutResult.get("Set-Cookie"))).forEach(
    ([_name, value]) => {
      expect(value).toEqual("");
    },
  );
});

afterAll(async () => {
  await app?.close();
});
