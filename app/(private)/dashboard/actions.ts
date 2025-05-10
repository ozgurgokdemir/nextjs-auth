'use server';

import { prisma } from '@/lib/db/prisma';
import { getSession, updateSession } from '@/lib/auth/session';
import { createSalt, hashPassword } from '@/lib/auth/password';
import { nameSchema, passwordSchema } from '@/lib/auth/definitions';

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

export async function updateUserPassword(password: string) {
  const { success, data, error } = passwordSchema.safeParse(password);
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

  const salt = createSalt();
  const hashedPassword = await hashPassword(data, salt);

  const user = await prisma.user.update({
    where: {
      id: session.id,
    },
    data: {
      password: hashedPassword,
      salt,
    },
    select: {
      id: true,
      role: true,
    },
  });

  await updateSession(user);

  return {
    status: 'success',
    message: 'Your password is updated',
  };
}

export async function disconnectProvider(provider: string) {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }

  await prisma.provider.deleteMany({
    where: {
      userId: session.id,
      provider,
    },
  });

  await updateSession(session);

  return {
    status: 'success',
    message: 'Your account is disconnected',
  };
}
