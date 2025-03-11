'use server';

import { z } from 'zod';
import { getSession, updateSession, sessionSchema } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

type Role = z.infer<typeof sessionSchema.shape.role>;

export async function updateRole(role: Role) {
  const { success, data } = sessionSchema.shape.role.safeParse(role);

  if (!success) {
    return {
      status: 'error',
      message: 'Invalid role provided.',
    };
  }

  const session = await getSession();

  if (!session) {
    return {
      status: 'error',
      message: 'User is not authenticated.',
    };
  }

  const user = await prisma.user.update({
    where: {
      id: session.id,
    },
    data: {
      role: data,
    },
    select: {
      id: true,
      role: true,
    },
  });

  await updateSession(user);

  return {
    status: 'success',
    message: 'Role successfuly updated.',
  };
}
