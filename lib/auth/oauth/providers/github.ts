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
  .transform((data) => {
    const primaryEmail = data.find(
      ({ primary, verified }) => primary && verified
    )?.email;
    if (!primaryEmail) {
      throw new Error('No primary and verified email found');
    }
    return primaryEmail;
  });

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
      const userPromise = fetch('https://api.github.com/user', {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      });
      const emailsPromise = fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      });

      const [userResponse, emailsResponse] = await Promise.all([
        userPromise,
        emailsPromise,
      ]);

      const userData = await userResponse.json();
      const emailsData = await emailsResponse.json();

      const user = userSchema.safeParse(userData);
      if (!user.success) return;

      const email = emailSchema.safeParse(emailsData);
      if (!email.success) return;

      return { ...user.data, email: email.data };
    },
  });
}
