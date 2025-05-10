import 'server-only';

import { cache } from 'react';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const getUser = cache(async () => {
  const session = await getSession();

  if (!session) return;

  return await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      providers: {
        select: {
          provider: true,
        },
      },
    },
  });
});
