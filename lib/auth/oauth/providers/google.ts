import { z } from 'zod';
import { OAuthClient } from '@/lib/auth/oauth/client';

const userSchema = z
  .object({
    sub: z.string(),
    email: z.string(),
    name: z.string(),
    picture: z.string(),
  })
  .transform((data) => ({
    id: data.sub,
    email: data.email,
    name: data.name,
    avatar: data.picture,
  }));

export function createGoogleOAuthClient() {
  return new OAuthClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    scopes: ['openid', 'profile', 'email'],
    endpoints: {
      auth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
    },
    getUser: async ({ tokenType, accessToken }) => {
      const response = await fetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      const { data: user } = userSchema.safeParse(data);
      return user;
    },
  });
}
