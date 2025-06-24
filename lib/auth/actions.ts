'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getUser } from '@/lib/db/queries';
import { createSalt, hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  createSession,
  deleteSession,
  getSession,
  updateSession,
} from '@/lib/auth/session';
import { getOAuthClient, Provider } from '@/lib/auth/oauth';
import {
  upsertPendingUser,
  sendEmailVerification,
  setVerificationEmailCookie,
  deleteVerificationEmailCookie,
  updateVerificationCode,
} from '@/lib/auth/email-verification';
import {
  upsertPasswordReset,
  sendPasswordResetEmail,
} from '@/lib/auth/password-reset';
import {
  upsertTwoFactor,
  createTwoFactorCookie,
  sendTwoFactorEmail,
  getTwoFactorIdFromCookie,
  getTwoFactor,
  deleteTwoFactor,
  deleteTwoFactorCookie,
  TWO_FACTOR_EXPIRATION_SECONDS,
} from '@/lib/auth/two-factor';
import {
  signInSchema,
  SignIn,
  signUpSchema,
  SignUp,
  emailVerificationSchema,
  EmailVerification,
  emailSchema,
  PasswordReset,
  passwordResetSchema,
  codeSchema,
} from '@/lib/auth/definitions';
import { getExpiresAt, isExpired } from '@/lib/security/time';

export async function signIn(credentials: SignIn) {
  const { success, data } = signInSchema.safeParse(credentials);
  if (!success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
    select: {
      id: true,
      email: true,
      password: true,
      salt: true,
      isTwoFactorEnabled: true,
      role: true,
    },
  });
  if (!user || !user.password || !user.salt) {
    return {
      error: 'User does not exist',
    };
  }

  const isPasswordValid = await verifyPassword({
    password: data.password,
    hashedPassword: user.password,
    salt: user.salt,
  });
  if (!isPasswordValid) {
    return {
      error: 'Password is incorrect',
    };
  }

  if (user.isTwoFactorEnabled) {
    const { id, code } = await upsertTwoFactor(user.id);

    await createTwoFactorCookie(id);

    await sendTwoFactorEmail(user.email, code);

    redirect('/two-factor');
  }

  await createSession(user);

  redirect('/dashboard');
}

export async function signUp(credentials: SignUp) {
  const { success, data } = signUpSchema.safeParse(credentials);
  if (!success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  if (existingUser) {
    return {
      error: 'User already exists',
    };
  }

  const salt = createSalt();
  const hashedPassword = await hashPassword(data.password, salt);

  const pendingUser = await upsertPendingUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    salt,
  });

  await sendEmailVerification(pendingUser.email, pendingUser.code);
  await setVerificationEmailCookie(pendingUser.email);

  redirect('/email-verification');
}

export async function signOut() {
  await deleteSession();

  redirect('/');
}

export async function oAuthSignIn(provider: Provider) {
  const oAuth = getOAuthClient(provider);

  const url = await oAuth.createAuthUrl();

  redirect(url.toString());
}

export async function verifyEmail(args: EmailVerification) {
  const { success, data } = emailVerificationSchema.safeParse(args);
  if (!success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const pendingUser = await prisma.pendingUser.findUnique({
    where: {
      email: data.email,
    },
  });
  if (!pendingUser) {
    redirect('/signup');
  }
  if (pendingUser.code !== data.code) {
    return {
      error: 'The entered code is incorrect',
    };
  }
  if (isExpired(pendingUser.expiresAt)) {
    await prisma.pendingUser.delete({
      where: {
        id: pendingUser.id,
      },
    });
    return {
      error: 'The entered code is expired',
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  if (existingUser) {
    return {
      error: 'User already exists',
    };
  }

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: pendingUser.email,
        name: pendingUser.name,
        password: pendingUser.password,
        salt: pendingUser.salt,
      },
    }),
    prisma.pendingUser.delete({
      where: {
        email: pendingUser.email,
      },
    }),
  ]);

  await deleteVerificationEmailCookie();
  await createSession(user);

  redirect('/dashboard');
}

export async function resendEmailVerification(email: string) {
  try {
    const validatedEmail = emailSchema.parse(email);
    const { code } = await updateVerificationCode(validatedEmail);
    await sendEmailVerification(validatedEmail, code);
    return {
      status: 'success',
      message: 'Verification code resent',
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: 'Something went wrong!',
    };
  }
}

export async function resetPassword(args: PasswordReset) {
  const { success, data } = passwordResetSchema.safeParse(args);
  if (!success) {
    return {
      error: 'Invalid token or password',
    };
  }

  const passwordReset = await prisma.passwordReset.findFirst({
    where: {
      token: data.token,
    },
    select: {
      id: true,
      email: true,
      expiresAt: true,
    },
  });
  if (!passwordReset) {
    return {
      error: 'The token is invalid',
    };
  }

  if (isExpired(passwordReset.expiresAt)) {
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id,
      },
    });
    return {
      error: 'The token is expired',
    };
  }

  const salt = createSalt();
  const hashedPassword = await hashPassword(data.password, salt);

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: {
        email: passwordReset.email,
      },
      data: {
        password: hashedPassword,
        salt,
      },
      select: {
        id: true,
        role: true,
      },
    }),
    prisma.passwordReset.delete({
      where: {
        id: passwordReset.id,
      },
    }),
  ]);

  await createSession(user);

  redirect('/dashboard');
}

export async function sendPasswordReset(email: string) {
  try {
    const validatedEmail = emailSchema.parse(email);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedEmail,
      },
      select: {
        email: true,
      },
    });
    if (!existingUser) {
      return {
        status: 'error',
        message: 'User does not exist',
      };
    }

    const { token } = await upsertPasswordReset(validatedEmail);
    await sendPasswordResetEmail(validatedEmail, token);

    return {
      status: 'success',
      message: 'Password reset email sent',
    };
  } catch (error) {
    console.error(error);

    return {
      status: 'error',
      message: 'Something went wrong!',
    };
  }
}

export async function verifyTwoFactor(code: string) {
  const { success, data } = codeSchema.safeParse(code);
  if (!success) {
    return {
      error: 'Two-factor authentication code is invalid',
    };
  }

  const twoFactorId = await getTwoFactorIdFromCookie();
  if (!twoFactorId) {
    return {
      error: 'Two-factor authentication code is expired',
    };
  }

  const twoFactor = await getTwoFactor(twoFactorId);
  if (!twoFactor) {
    return {
      error: 'Two-factor authentication code is expired',
    };
  }
  if (twoFactor.code !== data) {
    return {
      error: 'Two-factor authentication code is incorrect',
    };
  }

  await deleteTwoFactor(twoFactor.id);

  await deleteTwoFactorCookie();

  if (isExpired(twoFactor.expiresAt)) {
    return {
      error: 'Two-factor authentication code is expired',
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: twoFactor.userId,
    },
  });
  if (!user) {
    return {
      error: 'User does not exist',
    };
  }

  const sessionData = {
    ...user,
    isTwoFactorVerified: true,
    twoFactorExpiresAt: getExpiresAt(TWO_FACTOR_EXPIRATION_SECONDS),
  };

  const session = await getSession();
  if (session) {
    if (user.id !== session.id) {
      return {
        error: 'User does not match the current session',
      };
    }
    await updateSession(sessionData);
  } else {
    await createSession(sessionData);

    redirect('/dashboard');
  }

  return {};
}

export async function sendTwoFactor() {
  try {
    const user = await getUser();
    if (!user) {
      return {
        status: 'error',
        message: 'User is not authenticated',
      };
    }

    const { id, code } = await upsertTwoFactor(user.id);

    await createTwoFactorCookie(id);

    await sendTwoFactorEmail(user.email, code);

    return {
      status: 'success',
      message: 'Password reset email sent',
    };
  } catch (error) {
    console.error(error);

    return {
      status: 'error',
      message: 'Something went wrong!',
    };
  }
}
