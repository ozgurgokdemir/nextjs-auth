import 'server-only';

import { cache } from 'react';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const getUser = cache(async () => {
  const session = await getSession();

  if (!session) return;

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      password: true,
      providers: {
        select: {
          provider: true,
        },
      },
      isTwoFactorEnabled: true,
      role: true,
    },
  });
  if (!user) return;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    hasPassword: Boolean(user.password),
    providers: user.providers.map(({ provider }) => provider),
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    role: user.role,
  };
});
