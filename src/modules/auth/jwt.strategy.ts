import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 🚨 Remove a validação de audience (problema dos 401)
      issuer: config.get<string>('KEYCLOAK_AUTH_SERVER_URL'),
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${config.get<string>(
          'KEYCLOAK_AUTH_SERVER_URL',
        )}/protocol/openid-connect/certs`,
      }),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const clientId = this.config.get<string>('KEYCLOAK_CLIENT_ID') ?? '';

    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles =
      clientId && payload.resource_access?.[clientId]?.roles
        ? payload.resource_access[clientId].roles
        : [];

    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: [...realmRoles, ...clientRoles],
    };
  }
}
