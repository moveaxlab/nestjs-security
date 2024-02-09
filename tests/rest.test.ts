import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Authenticated, CookieService, SecurityModule } from "../src";
import { FastifyRequest, FastifyReply } from "fastify";
import { sign } from "jsonwebtoken";
import fastifyCookie from "@fastify/cookie";
import { Resolver, Query, Mutation, GraphQLModule, ObjectType, Field, Context } from "@nestjs/graphql";
import { Module } from "@nestjs/common";
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@ObjectType()
class Cat {
  @Field(() => String)
  hello: string;
}

@Resolver(() => Cat)
class TestResolver {
  constructor(private readonly cookieService: CookieService) {}

  @Mutation(() => Boolean)
  async login(@Context() req: FastifyRequest) {
    const res = (req as any).res as FastifyReply;
    const accessToken = sign(
      {
        tokenType: "dog",
        uid: "corgi",
      },
      "secret",
    );
    const refreshToken = "refresh";
    await this.cookieService.setCookies(res , accessToken, refreshToken);
    return true;
  }

  @Query(() => Cat)
  @Authenticated("dog")
  async cats() {
    return {
      hello: "world",
    };
  }
}

@Module({ providers: [TestResolver ]})
class ResolverModule {}

let app: NestFastifyApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ResolverModule,
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        context: (req : FastifyRequest , res: FastifyReply) => {
          //@ts-expect-error
          req.res = res;
          return req;
        },
      }),
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
    url: "/graphql",
    body: { query: `mutation { login }`}
  });
  expect(result.statusCode).toEqual(200);
  expect(result.cookies).toHaveLength(2);

  // const cookies = result.cookies.reduce(
  //   (acc, val) => {
  //     acc[val.name] = val.value;
  //     return acc;
  //   },
  //   {} as { [k: string]: string },
  // );
  // const result2 = await app.inject({
  //   method: "POST",
  //   url: "/graphql",
  //   body: { query: `{ cats() { hello } }`},
  //   cookies,
  // });
  // expect(result2.statusCode).toEqual(200);
});

afterAll(async () => {
  await app?.close();
});
