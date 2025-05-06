'use server';

import { getSession, updateSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { nameSchema } from '@/lib/auth/definitions';

export async function updateUserName(name: string) {
  const { success, data, error } = nameSchema.safeParse(name);
  if (!success) {
    return {
      status: 'error',
      message: error.flatten().formErrors[0],
    };
  }

  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }

  const user = await prisma.user.update({
    where: {
      id: session.id,
    },
    data: {
      name: data,
    },
    select: {
      id: true,
      role: true,
    },
  });

  await updateSession(user);

  return {
    status: 'success',
    message: 'Your name is updated',
  };
}
