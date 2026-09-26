import crypto from 'node:crypto';
import http from 'node:http';

const domain = 'dev-o7smo87hd04rbgrd.us.auth0.com';
const audience = 'https://arman-malik-backend-api';
const redirectUri = 'http://localhost:3001/callback';

// Put the Client ID of "Arman Malik Backend Client" here.
// Client ID is okay for a PKCE public-client test.
// Do NOT put the Client Secret here.
const clientId = 'qvtHCSWf3YNxRFl5R4oHJ4T8MWNUr3u4';

const base64url = (buffer) =>
  buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const codeVerifier = base64url(crypto.randomBytes(32));
const codeChallenge = base64url(
  crypto.createHash('sha256').update(codeVerifier).digest(),
);
const state = base64url(crypto.randomBytes(16));

const authorizationUrl = new URL(`https://${domain}/authorize`);

authorizationUrl.searchParams.set('response_type', 'code');
authorizationUrl.searchParams.set('client_id', clientId);
authorizationUrl.searchParams.set('redirect_uri', redirectUri);
authorizationUrl.searchParams.set('scope', 'openid profile email');
authorizationUrl.searchParams.set('audience', audience);
authorizationUrl.searchParams.set('code_challenge', codeChallenge);
authorizationUrl.searchParams.set('code_challenge_method', 'S256');
authorizationUrl.searchParams.set('state', state);

const server = http.createServer(async (req, res) => {
  try {
    const callbackUrl = new URL(req.url, redirectUri);

    if (callbackUrl.pathname !== '/callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const returnedState = callbackUrl.searchParams.get('state');
    const code = callbackUrl.searchParams.get('code');
    const error = callbackUrl.searchParams.get('error');

    if (error) {
      throw new Error(
        callbackUrl.searchParams.get('error_description') ?? error,
      );
    }

    if (returnedState !== state) {
      throw new Error('Invalid OAuth state');
    }

    if (!code) {
      throw new Error('Authorization code was not returned');
    }

    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(JSON.stringify(tokens));
    }

    res.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
    });
    res.end('Authentication successful. You can close this browser tab.');

    console.log('\nACCESS TOKEN:\n');
    console.log(tokens.access_token);
    console.log('\nKeep this token private.\n');
  } catch (error) {
    res.writeHead(500, {
      'content-type': 'text/plain; charset=utf-8',
    });
    res.end('Authentication failed. Check the terminal.');

    console.error(error);
  } finally {
    server.close();
  }
});

server.listen(3001, () => {
  console.log('\nOpen this URL in your browser:\n');
  console.log(authorizationUrl.toString());
  console.log('\nWaiting for Auth0 login...\n');
});