import { z } from 'zod';
import { OAuthClient } from '@/lib/auth/oauth/client';

const userSchema = z
  .object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    name: z.string().optional(),
  })
  .transform((data) => ({
    id: data.id.toString(),
    name: data.name ?? data.login,
    avatar: data.avatar_url,
  }));
const emailSchema = z
  .array(
    z.object({
      email: z.string(),
      primary: z.boolean(),
      verified: z.boolean(),
    })
  )
  .transform(
    (data) => data.find(({ primary, verified }) => primary && verified)?.email
  );

export function createGitHubOAuthClient() {
  return new OAuthClient({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: process.env.GITHUB_REDIRECT_URI!,
    scopes: ['read:user', 'user:email'],
    endpoints: {
      auth: 'https://github.com/login/oauth/authorize',
      token: 'https://github.com/login/oauth/access_token',
    },
    getUser: async ({ tokenType, accessToken }) => {
      const user = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      }).then(async (response) => {
        const data = await response.json();
        const { data: user } = userSchema.safeParse(data);
        return user;
      });
      if (!user) return;
      const email = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      }).then(async (response) => {
        const data = await response.json();
        const { data: email } = emailSchema.safeParse(data);
        return email;
      });
      if (!email) return;
      return { ...user, email };
    },
  });
}
