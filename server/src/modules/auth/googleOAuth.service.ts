import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { resolvePublicApiBaseUrl } from '../telegram/telegram.webhookConfig.js';
import { ApiError } from '../../utils/ApiError.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export type GoogleOAuthPurpose = 'link' | 'login';

export type GoogleOAuthState = {
  purpose: GoogleOAuthPurpose;
  profileId?: string;
  returnPath?: string;
};

function ensureGoogleOAuthConfigured(): { clientId: string; clientSecret: string } {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId) {
    throw ApiError.serviceUnavailable('Google sign-in is not configured', 'GOOGLE_NOT_CONFIGURED');
  }
  if (!clientSecret) {
    throw ApiError.serviceUnavailable(
      'Google OAuth redirect is not configured (set GOOGLE_CLIENT_SECRET on the API server)',
      'GOOGLE_OAUTH_NOT_CONFIGURED',
    );
  }
  return { clientId, clientSecret };
}

export function resolveGoogleOAuthRedirectUri(): string {
  const base = resolvePublicApiBaseUrl();
  if (!base) {
    throw ApiError.serviceUnavailable(
      'Public API URL is not configured (PUBLIC_API_URL or RAILWAY_PUBLIC_DOMAIN)',
      'API_PUBLIC_URL_MISSING',
    );
  }
  return `${base}/api/auth/google/oauth/callback`;
}

export function signGoogleOAuthState(state: GoogleOAuthState): string {
  return jwt.sign(state, env.JWT_SECRET, { expiresIn: '15m' });
}

export function verifyGoogleOAuthState(token: string): GoogleOAuthState {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as GoogleOAuthState;
    if (payload.purpose !== 'link' && payload.purpose !== 'login') {
      throw new Error('invalid purpose');
    }
    if (payload.purpose === 'link' && !payload.profileId?.trim()) {
      throw new Error('missing profileId');
    }
    return payload;
  } catch {
    throw ApiError.badRequest('Invalid or expired Google OAuth state', 'GOOGLE_OAUTH_STATE_INVALID');
  }
}

export function buildGoogleAuthorizationUrl(stateToken: string): string {
  const { clientId } = ensureGoogleOAuthConfigured();
  const redirectUri = resolveGoogleOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateToken,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<string> {
  const { clientId, clientSecret } = ensureGoogleOAuthConfigured();
  const redirectUri = resolveGoogleOAuthRedirectUri();

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string };
  const idToken = data.id_token?.trim();
  if (!res.ok || !idToken) {
    const detail = data.error_description?.trim() || data.error?.trim() || `HTTP ${res.status}`;
    throw ApiError.unauthorized(`Google OAuth failed: ${detail}`, 'GOOGLE_OAUTH_EXCHANGE_FAILED');
  }
  return idToken;
}

export function buildClientOAuthDoneUrl(params: {
  purpose: GoogleOAuthPurpose;
  token?: string;
  error?: string;
  returnPath?: string;
}): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  const url = new URL(`${base}/auth/google/done`);
  if (params.error) url.searchParams.set('error', params.error);
  if (params.purpose === 'link') url.searchParams.set('status', 'linked');
  if (params.returnPath?.startsWith('/')) url.searchParams.set('from', params.returnPath);
  const hash = params.token ? `#token=${encodeURIComponent(params.token)}` : '';
  return `${url.toString()}${hash}`;
}
