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
      name: true,
      email: true,
      role: true,
    },
  });

  if (user && user.id === session.id) {
    return user;
  }
});
