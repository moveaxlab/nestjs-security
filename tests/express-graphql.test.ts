import { Test } from "@nestjs/testing";
import request from "supertest";
import { Authenticated, CookieService, HasPermission, SecurityModule } from "../src";
import { sign } from "jsonwebtoken";
import {
  Resolver,
  Query,
  Mutation,
  GraphQLModule,
  ObjectType,
  Field,
  Context,
  ResolveField,
} from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Request, Response } from "express";
import { NestApplication } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { parseExpressCookies } from "./utils";

@ObjectType()
class Cat {
  @Field(() => String)
  hello: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  nickname: string;
}

@Resolver(() => Cat)
class TestResolver {
  constructor(private readonly cookieService: CookieService) {}

  @Mutation(() => Boolean)
  async login(@Context("res") res: Response) {
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
        permissions: ['nickname.read']
      },
      "secret",
    );
    const refreshToken = "refresh";
    await this.cookieService.setCookies(res, accessToken, refreshToken);
    return true;
  }

  @Mutation(() => Boolean)
  async logout(@Context("req") req: Request, @Context("res") res: Response) {
    await this.cookieService.clearCookies(req, res);
  }

  @Query(() => Cat)
  @Authenticated("dog")
  async cats() {
    return {
      hello: "world",
    };
  }

  @ResolveField()
  @Authenticated("dog")
  async name() {
    return "dog";
  }

  @ResolveField()
  @HasPermission("nickname.read")
  async nickname() {
    return "fuffi";
  }
}

let app: NestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    providers: [TestResolver],
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        fieldResolverEnhancers: ["interceptors", "guards", "filters"],
        context: ({ req, res }: { req: Request; res: Response }) => ({
          req,
          res,
        }),
      }),
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
  }).compile();

  app = moduleRef.createNestApplication<NestApplication>({
    logger: ["verbose", "debug", "log", "warn", "error", "fatal"],
  });

  app.use(cookieParser());

  await app.init();
});

it(`performs login, query, and logout`, async () => {
  const loginResult = await request(app.getHttpServer())
    .post("/graphql")
    .send({ query: `mutation { login }` });
  expect(loginResult.statusCode).toEqual(200);
  expect(loginResult.get("Set-Cookie")).toHaveLength(2);

  const cookies = loginResult.get("Set-Cookie");

  const queryResult = await request(app.getHttpServer())
    .post("/graphql")
    .set("Cookie", cookies)
    .send({
      query: `{ cats { hello name nickname } }`,
    });
  expect(queryResult.statusCode).toEqual(200);

  const logoutResult = await request(app.getHttpServer())
    .post("/graphql")
    .set("Cookie", cookies)
    .send({ query: `mutation { logout }` });
  expect(logoutResult.statusCode).toEqual(200);
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
