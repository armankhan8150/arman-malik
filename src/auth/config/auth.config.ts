export interface AuthConfig {
  issuer: string;
  audience: string;
  jwksUri: string;
}

export function getAuthConfig(): AuthConfig {
  const issuer = process.env.AUTH_ISSUER;
  const audience = process.env.AUTH_AUDIENCE;
  const jwksUri = process.env.AUTH_JWKS_URI;

  if (!issuer || !audience || !jwksUri) {
    throw new Error(
      'Authentication configuration is incomplete. ' +
        'AUTH_ISSUER, AUTH_AUDIENCE, and AUTH_JWKS_URI are required.',
    );
  }

  return {
    issuer,
    audience,
    jwksUri,
  };
}