import crypto from 'crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateToken } from '@/lib/security/token';

type Endpoints = {
  auth: string;
  token: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

const STATE_COOKIE_KEY = 'oauth_state';
const CODE_VERIFIER_COOKIE_KEY = 'oauth_code_verifier';
const COOKIE_EXPIRATION_SECONDS = 60 * 10;

const tokenSchema = z
  .object({
    access_token: z.string(),
    token_type: z.string(),
  })
  .transform((data) => ({
    accessToken: data.access_token,
    tokenType: data.token_type,
  }));

export class OAuthClient {
  private clientId;
  private clientSecret;
  private redirectUri;
  private scopes;
  private endpoints;
  private _getUser;

  constructor({
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    endpoints,
    getUser,
  }: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    endpoints: Endpoints;
    getUser: (token: z.infer<typeof tokenSchema>) => Promise<User | undefined>;
  }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
    this.endpoints = endpoints;
    this._getUser = getUser;
  }

  async createAuthUrl() {
    const state = await this.createState();
    const codeVerifier = await this.createCodeVerifier();
    const codeChallenge = await this.createCodeChallenge(codeVerifier);
    const url = new URL(this.endpoints.auth);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('scope', this.scopes.join(' '));
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', codeChallenge);
    return url;
  }

  async getUser(state: string, code: string) {
    const isStateValid = await this.validateState(state);
    if (!isStateValid) return;
    const codeVerifier = await this.getCodeVerifier();
    if (!codeVerifier) return;
    const token = await this.validateToken(code, codeVerifier);
    if (!token) return;
    return this._getUser(token);
  }

  private async validateToken(code: string, codeVerifier: string) {
    const response = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });
    const data = await response.json();
    const { data: token } = tokenSchema.safeParse(data);
    return token;
  }

  private async createState() {
    const state = generateToken();
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE_KEY, state, {
      path: '/',
      expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
    return state;
  }

  private async validateState(state: string) {
    const cookieStore = await cookies();
    const cookieState = cookieStore.get(STATE_COOKIE_KEY)?.value;
    return state === cookieState;
  }

  private async createCodeVerifier() {
    const codeVerifier = generateToken();
    const cookieStore = await cookies();
    cookieStore.set(CODE_VERIFIER_COOKIE_KEY, codeVerifier, {
      path: '/',
      expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
    return codeVerifier;
  }

  private async getCodeVerifier() {
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE_KEY)?.value;
    return codeVerifier;
  }

  private createCodeChallenge(codeVerifier: string) {
    const codeChallenge = crypto.hash('sha256', codeVerifier, 'base64url');
    return codeChallenge;
  }
}
