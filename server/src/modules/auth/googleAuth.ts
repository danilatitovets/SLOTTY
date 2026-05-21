import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export type GoogleIdTokenPayload = {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw ApiError.serviceUnavailable('Google sign-in is not configured', 'GOOGLE_NOT_CONFIGURED');
  }

  const url = new URL('https://oauth2.googleapis.com/tokeninfo');
  url.searchParams.set('id_token', idToken.trim());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw ApiError.unauthorized('Invalid Google token', 'GOOGLE_TOKEN_INVALID');
  }

  const data = (await res.json()) as Record<string, unknown>;
  const aud = typeof data.aud === 'string' ? data.aud : '';
  if (aud !== clientId) {
    throw ApiError.unauthorized('Google token audience mismatch', 'GOOGLE_TOKEN_AUDIENCE');
  }

  const sub = typeof data.sub === 'string' ? data.sub.trim() : '';
  if (!sub) {
    throw ApiError.unauthorized('Invalid Google token subject', 'GOOGLE_TOKEN_INVALID');
  }

  const emailVerified =
    data.email_verified === true ||
    data.email_verified === 'true' ||
    data.email_verified === '1';

  return {
    sub,
    email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : undefined,
    email_verified: emailVerified,
    name: typeof data.name === 'string' ? data.name.trim() : undefined,
    picture: typeof data.picture === 'string' ? data.picture.trim() : undefined,
  };
}
