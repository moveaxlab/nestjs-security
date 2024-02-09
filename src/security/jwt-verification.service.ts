import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtVerificationService {
  constructor(private readonly jwtService: JwtService) {}

  async verify(token: string) {
    return await this.jwtService.verify(token, {
      ignoreExpiration: false,
    });
  }
}
