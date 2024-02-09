/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicModule, Module } from "@nestjs/common";
import { CookieService } from "./cookie.service";
import {
  REDIS_INJECTION_KEY,
  SECURITY_CONFIG_INJECTION_KEY,
} from "../constants";
import { JwtModule } from "@nestjs/jwt";
import { JwtVerificationService } from "./jwt-verification.service";
import { jwtModuleSecretOrKeyProvider } from "./secret.provider";
import {
  SecurityModuleCookieOptions,
  SecurityModuleHeaderOptions,
  SecurityModuleOptions,
} from "./options";
import { CookieJwtStrategy } from "./cookie.jwt-strategy";
import Redis from "ioredis";
import { HeaderJwtStrategy } from "./header.jwt-strategy";

export interface SecurityModuleCookieAsyncOptions {
  type: SecurityModuleCookieOptions["type"];
  redis?: SecurityModuleCookieOptions["redis"];
  imports?: any[];
  inject: any[];
  useFactory(...args: any[]): Omit<SecurityModuleCookieOptions, "type">;
}

export interface SecurityModuleHeaderAsyncOptions {
  type: SecurityModuleHeaderOptions["type"];
  imports?: any[];
  inject: any[];
  useFactory(...args: any[]): Omit<SecurityModuleHeaderOptions, "type">;
}

export type SecurityModuleAsyncOptions =
  | SecurityModuleCookieAsyncOptions
  | SecurityModuleHeaderAsyncOptions;

@Module({})
export class SecurityModule {
  static forRoot({ type, ...options }: SecurityModuleOptions): DynamicModule {
    return this.forRootAsync({
      type: type as any,
      redis:
        type === "cookie"
          ? (options as SecurityModuleCookieOptions).redis
          : undefined,
      inject: [],
      useFactory: () => options,
    });
  }

  static forRootAsync(options: SecurityModuleAsyncOptions): DynamicModule {
    const imports: DynamicModule["imports"] = [
      JwtModule.registerAsync({
        imports: options.imports,
        inject: options.inject,
        useFactory(...args: any[]) {
          const config = options.useFactory(...args);
          return {
            secretOrKeyProvider: jwtModuleSecretOrKeyProvider(config.jwtSecret),
          };
        },
      }),
    ];

    const providers: DynamicModule["providers"] = [
      JwtVerificationService,
      {
        provide: SECURITY_CONFIG_INJECTION_KEY,
        inject: options.inject,
        useFactory: options.useFactory,
      },
    ];

    const exports: DynamicModule["exports"] = [JwtVerificationService];

    if (options.imports) {
      imports.push(...options.imports);
    }

    if (options.type === "cookie") {
      providers.push(CookieService, CookieJwtStrategy);

      exports.push(CookieService, CookieJwtStrategy);

      if (options.redis) {
        providers.push({
          provide: REDIS_INJECTION_KEY,
          inject: options.inject,
          useFactory(...args: any[]) {
            const config = options.useFactory(...args);
            return new Redis({
              connectionName: "security",
              keyPrefix: "security",
              host: config.redis!.host,
              port: config.redis!.port,
              password: config.redis!.password,
              tls: config.redis!.tlsEnabled ? {} : undefined,
            });
          },
        });

        exports.push(REDIS_INJECTION_KEY);
      }
    } else {
      providers.push(HeaderJwtStrategy);

      exports.push(HeaderJwtStrategy);
    }

    return {
      module: SecurityModule,
      imports,
      global: true,
      providers,
      exports,
    };
  }
}
