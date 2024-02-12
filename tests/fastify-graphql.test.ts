import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Authenticated, CookieService, SecurityModule } from "../src";
import { FastifyRequest, FastifyReply } from "fastify";
import { sign } from "jsonwebtoken";
import fastifyCookie from "@fastify/cookie";
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
import { parseFastifyCookies } from "./utils";

@ObjectType()
class Cat {
  @Field(() => String)
  hello: string;

  @Field(() => String)
  name: string;
}

@Resolver(() => Cat)
class TestResolver {
  constructor(private readonly cookieService: CookieService) {}

  @Mutation(() => Boolean)
  async login(@Context() { res }: { res: FastifyReply }) {
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
      },
      "secret",
    );
    const refreshToken = "refresh";
    await this.cookieService.setCookies(res, accessToken, refreshToken);
    return true;
  }

  @Mutation(() => Boolean)
  async logout(
    @Context("req") req: FastifyRequest,
    @Context() { res }: { res: FastifyReply },
  ) {
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
}

let app: NestFastifyApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    providers: [TestResolver],
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        context: (req: FastifyRequest, res: FastifyReply) => {
          return { req, res };
        },
        fieldResolverEnhancers: ["interceptors", "guards", "filters"],
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

it(`performs login, query, and logout`, async () => {
  const loginResult = await app.inject({
    method: "POST",
    url: "/graphql",
    body: { query: `mutation { login }` },
  });
  expect(loginResult.statusCode).toEqual(200);
  expect(loginResult.cookies).toHaveLength(2);

  const cookies = parseFastifyCookies(loginResult.cookies);
  const queryResult = await app.inject({
    method: "POST",
    url: "/graphql",
    body: { query: `{ cats { hello name } }` },
    cookies,
  });
  expect(queryResult.statusCode).toEqual(200);

  const logoutResult = await app.inject({
    method: "POST",
    url: "/graphql",
    body: { query: `mutation { logout }` },
    cookies,
  });
  expect(logoutResult.statusCode).toEqual(200);
  expect(logoutResult.cookies).toHaveLength(3);
  logoutResult.cookies.forEach((cookie) => {
    expect(cookie.value).toEqual("");
  });
});

afterAll(async () => {
  await app?.close();
});
