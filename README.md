# NestJS Security

![NPM](https://img.shields.io/npm/l/%40moveaxlab%2Fnestjs-security)
[![npm](https://img.shields.io/npm/v/@moveaxlab/nestjs-security)](https://www.npmjs.com/package/@moveaxlab/nestjs-security)

This package contains security utilities for NestJS projects,
for both REST and GraphQL API gateways.
It supports both express and fastify.

## Installation

```bash
yarn add @moveaxlab/nestjs-security
```

## Setup with cookies

For web applications you can rely on cookies.

Include the `SecurityModule` inside your application:

```typescript
import { SecurityModule } from '@moveaxlab/nestjs-security';

@Module({
    imports: [
        SecurityModule.forRoot({
            type: "cookie",
            cookieDomain: "localhost",  // the domain of your app
            cookieExpirationMilliseconds: 15 * 60 * 1000,
            jwtSecret: "secret",
            // the name of your cookies
            accessTokenCookieName: "access_token",
            opaqueTokenCookieName: "opaque_token",
            refreshTokenCookieName: "refresh_token",
        })
    ]
})
export class AppModule;
```

Remember to enable [cookie support](https://docs.nestjs.com/techniques/cookies) for your application.

When using cookies, you can replace the access token with an opaque token
if your access token may be too big for HTTP headers.

To enable the opaque token, install `ioredis` as a dependency,
and configure the `redis` option.
The access token will be stored on the configured redis server,
and will be replaced in the cookies with a randomly generated token.

## Setup with headers

For mobile and desktop applications you can rely on authentication headers.

```typescript
import { SecurityModule } from '@moveaxlab/nestjs-security';

@Module({
    imports: [
        SecurityModule.forRoot({
            type: "header",
            jwtSecret: "secret",
        })
    ]
})
export class AppModule;
```

## Custom token conversion logic

All configurations accept a `tokenConverter` option to implement
custom transformations on the parsed access token.

## Authenticating users

You can authenticate users based on their role (or token type).
The library assumes that all access tokens contain a `tokenType` field.
Authentication can be applied on the class level or on the method level.

```typescript
import { Authenticated } from "@moveaxlab/nestjs-security";

@Authenticated("admin", "user")
class MyController {
  async firstMethod() {
    // accessible to both admins and users
  }

  @Authenticated("admin")
  async secondMethod() {
    // only accessible to admins
  }
}
```

## Setting cookies

Use the `CookieService` to set and unset the access token and refresh token.

When using express:

```typescript
import { CookieService } from "@movexlab/nestjs-security";
import { Request, Response } from "express";

class Controller {
  constructor(private readonly cookieService: CookieService) {}

  async login(@Res({ passthrough: true }) res: Response) {
    await this.cookieService.setCookies(res, accessToken, refreshToken);
  }

  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.cookieService.clearCookies(req, res);
  }
}
```

When using fastify:

```typescript
import { CookieService } from "@movexlab/nestjs-security";
import { FastifyRequest, FastifyReply } from "fastify";

class Controller {
  constructor(private readonly cookieService: CookieService) {}

  async login(@Res({ passthrough: true }) res: FastifyReply) {
    await this.cookieService.setCookies(res, accessToken, refreshToken);
  }

  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.cookieService.clearCookies(req, res);
  }
}
```

### Using GraphQL

If you are using GraphQL, the request and response must be retrieved
from the GraphQL context.

For express, setup your GraphQL module like this:

```typescript
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';

@Module({
    imports: [
        GraphQLModule.forRoot({
            // ...
            context: ({ req, res }: { req: Request, res: Response }) => ({ req, res }),
        })
    ]
})
export class AppModule;
```

With fastify, the setup should look like this:

```typescript
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyRequest, FastifyReply } from 'fastify';

@Module({
    imports: [
        GraphQLModule.forRoot({
            // ...
            context: (req: FastifyRequest, res: FastifyReply) => ({ req, res }),
        })
    ]
})
export class AppModule;
```

Inside your resolvers you can access the request and response objects
using the `@Context("req")` and `@Context("res")` decorators.

> If you are using fastify, you cannot access the response using `@Context("res")`
> due to a bug in `@nestjs/core`.
> Access it instead with `@Context() { res }: { res: FastifyReply }`.

## Getting the tokens inside a controller or resolver

You can access the parsed access token and refresh token
inside your controllers and resolvers using decorators.

```typescript
import { Authenticated, AccessToken } from "@moveaxlab/nestjs-security";

interface User {
  tokenType: "admin" | "user";
  uid: string;
  // other information contained in the token
}

@Authenticated("admin")
class MyController {
  async myMethod(@AccessToken() token: User) {
    // use the token here
  }
}
```

The refresh token can be accessed via decorators when using cookies.
Include the `RefreshCookieInterceptor` to retrieve it.

```typescript
import {
  Authenticated,
  RefreshToken,
  RefreshCookieInterceptor,
} from "@moveaxlab/nestjs-security";

@Authenticated("admin")
@UseInterceptors(RefreshCookieInterceptor)
class MyController {
  async myMethod(@RefreshToken() token: string) {
    // use the token here
  }
}
```

## Using different secrets based on the issuer

The `jwtSecret` options can accept an object mapping the `iss` key
contained in the token with the secret or key used to sign the token.
