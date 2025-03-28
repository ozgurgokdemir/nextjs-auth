import { z } from 'zod';
import { createGoogleOAuthClient } from './providers/google';
import { createGitHubOAuthClient } from './providers/github';

export const providerSchema = z.union([
  z.literal('google'),
  z.literal('github'),
]);
export type Provider = z.infer<typeof providerSchema>;

export function getOAuthClient(provider: Provider) {
  switch (provider) {
    case 'google':
      return createGoogleOAuthClient();
    case 'github':
      return createGitHubOAuthClient();
  }
}
