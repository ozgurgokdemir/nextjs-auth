'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { deleteSession, getSession, updateSession } from '@/lib/auth/session';
import { createSalt, hashPassword } from '@/lib/auth/password';
import { codeSchema, nameSchema, passwordSchema } from '@/lib/auth/definitions';
import {
  sendDeleteAccountEmail,
  upsertDeleteAccount,
} from '@/lib/auth/delete-account';
import { getUser } from '@/lib/db/queries';

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

export async function deleteAccount(code: string) {
  const { success, data, error } = codeSchema.safeParse(code);
  if (!success) {
    return {
      error: error.flatten().formErrors[0],
    };
  }

  const session = await getSession();
  if (!session) {
    return {
      error: 'User is not authenticated',
    };
  }

  const deleteAccount = await prisma.deleteAccount.findUnique({
    where: {
      userId: session.id,
    },
  });
  if (!deleteAccount) {
    return {
      error: 'The entered code is expired',
    };
  }
  if (deleteAccount.expiresAt < new Date()) {
    await prisma.deleteAccount.delete({
      where: {
        id: deleteAccount.id,
      },
    });
    return {
      error: 'The entered code is expired',
    };
  }
  if (deleteAccount.code !== data) {
    return {
      error: 'The entered code is incorrect',
    };
  }

  await prisma.$transaction([
    prisma.user.delete({
      where: {
        id: session.id,
      },
    }),
    prisma.deleteAccount.delete({
      where: {
        userId: session.id,
      },
    }),
  ]);

  await deleteSession();

  redirect('/');
}

export async function sendDeleteAccount() {
  try {
    const user = await getUser();
    if (!user) {
      return {
        status: 'error',
        message: 'User is not authenticated',
      };
    }

    const { code } = await upsertDeleteAccount(user.id);
    await sendDeleteAccountEmail(user.email, code);

    return {
      status: 'success',
      message: 'Delete account email sent',
    };
  } catch (error) {
    console.error(error);

    return {
      status: 'error',
      message: 'Something went wrong!',
    };
  }
}
