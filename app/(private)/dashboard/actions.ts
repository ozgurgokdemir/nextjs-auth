'use server';

import { redirect } from 'next/navigation';
import { ratelimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/db/prisma';
import { getUser } from '@/lib/db/queries';
import {
  getSession,
  updateSession,
  deleteSession,
  invalidateSessions,
} from '@/lib/auth/session';
import { generateSalt, hashPassword } from '@/lib/auth/password';
import {
  sendDeleteAccountEmail,
  upsertDeleteAccount,
} from '@/lib/auth/delete-account';
import { deleteTwoFactorCookie } from '@/lib/auth/two-factor';
import { otpSchema, nameSchema, passwordSchema } from '@/lib/auth/definitions';
import { isExpired } from '@/lib/date';

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

  const user = await getUser();
  const session = await getSession();
  if (!user || !session) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }
  if (user.isTwoFactorEnabled) {
    if (!session.isTwoFactorVerified || !session.twoFactorExpiresAt) {
      return {
        status: 'error',
        message: 'Two-factor authentication is enabled, please verify first',
        requires2FA: true,
      };
    }
    if (session.twoFactorExpiresAt && isExpired(session.twoFactorExpiresAt)) {
      return {
        status: 'error',
        message: 'Your two-factor authentication is expired',
        requires2FA: true,
      };
    }
  }

  const salt = generateSalt();
  const hashedPassword = await hashPassword(data, salt);

  await prisma.user.update({
    where: {
      id: user.id,
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

  await invalidateSessions(user.id, session.sessionId);

  return {
    status: 'success',
    message: 'Your password is updated',
  };
}

export async function enableTwoFactor() {
  const user = await getUser();
  const session = await getSession();
  if (!user || !session) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }
  if (user.isTwoFactorEnabled) {
    return {
      status: 'error',
      message: 'Two-factor authentication is already enabled',
    };
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isTwoFactorEnabled: true,
    },
  });

  await updateSession(updatedUser);
  await deleteTwoFactorCookie();

  return {
    status: 'success',
    message: 'Two-factor authentication is enabled',
  };
}

export async function disableTwoFactor() {
  const user = await getUser();
  const session = await getSession();
  if (!user || !session) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }
  if (!user.isTwoFactorEnabled) {
    return {
      status: 'error',
      message: 'Two-factor authentication is not enabled',
    };
  }
  if (
    !session.twoFactorExpiresAt ||
    (session.twoFactorExpiresAt && isExpired(session.twoFactorExpiresAt))
  ) {
    return {
      status: 'error',
      message: 'Your two-factor authentication is expired',
      requires2FA: true,
    };
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isTwoFactorEnabled: false,
    },
  });

  await updateSession(updatedUser);
  await deleteTwoFactorCookie();

  return {
    status: 'success',
    message: 'Two-factor authentication is disabled',
  };
}

export async function disconnectProvider(provider: string) {
  const user = await getUser();
  if (!user) {
    return {
      status: 'error',
      message: 'User is not authenticated',
    };
  }

  await prisma.provider.deleteMany({
    where: {
      userId: user.id,
      provider,
    },
  });

  await updateSession(user);

  return {
    status: 'success',
    message: 'Your account is disconnected',
  };
}

export async function deleteAccount(code: string) {
  const { success, data, error } = otpSchema.safeParse(code);
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
  if (isExpired(deleteAccount.expiresAt)) {
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
        error: 'User is not authenticated',
      };
    }

    const sendEmailRateLimit = await ratelimit.sendEmail.limit(user.email);
    if (!sendEmailRateLimit.success) {
      return {
        error: 'Too many requests, please try again later',
      };
    }

    const { code } = await upsertDeleteAccount(user.id);
    await sendDeleteAccountEmail(user.email, code);

    return {};
  } catch (error) {
    console.error(error);

    return {
      error: 'Something went wrong!',
    };
  }
}
