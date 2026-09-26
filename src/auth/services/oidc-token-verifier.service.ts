import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTVerifyResult,
} from 'jose';
import { getAuthConfig } from '../config/auth.config';

export interface AccessTokenPayload extends JWTPayload {
  email?: unknown;
  email_verified?: unknown;
}

export interface VerifiedAccessToken {
  subject: string;
  payload: AccessTokenPayload;
}

export class OidcTokenVerifierService {
  private readonly config = getAuthConfig();

  private readonly jwks = createRemoteJWKSet(
    new URL(this.config.jwksUri),
  );

  async verify(
    accessToken: string,
  ): Promise<VerifiedAccessToken> {
    const result: JWTVerifyResult = await jwtVerify(
      accessToken,
      this.jwks,
      {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['RS256'],
        requiredClaims: ['sub', 'exp'],
      },
    );

    const subject = result.payload.sub;

    if (!subject) {
      throw new Error(
        'Access token does not contain a subject claim',
      );
    }

    if (
      typeof result.payload.exp !== 'number' ||
      result.payload.exp <=
        Math.floor(Date.now() / 1000)
    ) {
      throw new Error(
        'Access token is expired or missing expiry',
      );
    }

    return {
      subject,
      payload:
        result.payload as AccessTokenPayload,
    };
  }
}