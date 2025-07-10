'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ratelimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/db/prisma';
import { getUser } from '@/lib/db/queries';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/password';
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
  TwoFactor,
  twoFactorSchema,
} from '@/lib/auth/definitions';
import { getExpiresAt, isExpired } from '@/lib/date';
import { getClientIP } from '@/lib/ip';

export async function signIn(data: SignIn) {
  const signIn = signInSchema.safeParse(data);
  if (!signIn.success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const signInRateLimit = await ratelimit.signIn.limit(signIn.data.email);
  if (!signInRateLimit.success) {
    return {
      error: 'Too many requests, please try again later',
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: signIn.data.email,
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
    password: signIn.data.password,
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

export async function signUp(data: SignUp) {
  const signUp = signUpSchema.safeParse(data);
  if (!signUp.success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const signUpRateLimit = await ratelimit.signUp.limit(signUp.data.email);
  if (!signUpRateLimit.success) {
    return {
      error: 'Too many requests, please try again later',
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: signUp.data.email,
    },
  });
  if (existingUser) {
    return {
      error: 'User already exists',
    };
  }

  const salt = generateSalt();
  const hashedPassword = await hashPassword(signUp.data.password, salt);

  const pendingUser = await upsertPendingUser({
    name: signUp.data.name,
    email: signUp.data.email,
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

export async function verifyEmail(data: EmailVerification) {
  const emailVerification = emailVerificationSchema.safeParse(data);
  if (!emailVerification.success) {
    return {
      error: 'Invalid credentials',
    };
  }

  const emailVerificationRateLimit = await ratelimit.emailVerification.limit(
    emailVerification.data.email
  );
  if (!emailVerificationRateLimit.success) {
    return {
      error: 'Too many requests, please try again later',
    };
  }

  const pendingUser = await prisma.pendingUser.findUnique({
    where: {
      email: emailVerification.data.email,
    },
  });
  if (!pendingUser) {
    redirect('/signup');
  }
  if (pendingUser.code !== emailVerification.data.code) {
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
      email: emailVerification.data.email,
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

export async function resendEmailVerification(data: string) {
  try {
    const email = emailSchema.parse(data);

    const sendEmailRateLimit = await ratelimit.sendEmail.limit(email);
    if (!sendEmailRateLimit.success) {
      return {
        error: 'Too many requests, please try again later',
      };
    }

    const { code } = await updateVerificationCode(email);
    await sendEmailVerification(email, code);

    return {};
  } catch (error) {
    console.error(error);

    return {
      error: 'Something went wrong!',
    };
  }
}

export async function resetPassword(data: PasswordReset) {
  const input = passwordResetSchema.safeParse(data);
  if (!input.success) {
    return {
      error: 'Invalid token or password',
    };
  }

  const headersList = await headers();
  const clientIP = getClientIP(headersList);

  const passwordResetRateLimit = await ratelimit.passwordReset.limit(clientIP);
  if (!passwordResetRateLimit.success) {
    return {
      error: 'Too many requests, please try again later',
    };
  }

  const passwordReset = await prisma.passwordReset.findFirst({
    where: {
      token: input.data.token,
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

  const salt = generateSalt();
  const hashedPassword = await hashPassword(input.data.password, salt);

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

export async function sendPasswordReset(data: string) {
  try {
    const email = emailSchema.parse(data);

    const sendEmailRateLimit = await ratelimit.sendEmail.limit(email);
    if (!sendEmailRateLimit.success) {
      return {
        status: 'error',
        message: 'Too many requests, please try again later',
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
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

    const { token } = await upsertPasswordReset(email);
    await sendPasswordResetEmail(email, token);

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

export async function verifyTwoFactor(data: TwoFactor) {
  const input = twoFactorSchema.safeParse(data);
  if (!input.success) {
    return {
      error: 'Two-factor authentication code is invalid',
    };
  }

  const headersList = await headers();
  const clientIP = getClientIP(headersList);

  const twoFactorRateLimit = await ratelimit.twoFactor.limit(clientIP);
  if (!twoFactorRateLimit.success) {
    return {
      error: 'Too many requests, please try again later',
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
  if (twoFactor.code !== input.data.code) {
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
  if (!session) {
    await createSession(sessionData);

    redirect('/dashboard');
  } else {
    if (user.id !== session.id) {
      return {
        error: 'User does not match the current session',
      };
    }
    await updateSession(sessionData);
  }

  return {};
}

export async function sendTwoFactor() {
  try {
    const user = await (async () => {
      const currentUser = await getUser();
      if (currentUser) {
        return {
          id: currentUser.id,
          email: currentUser.email,
        };
      }

      const twoFactorId = await getTwoFactorIdFromCookie();
      if (!twoFactorId) return null;

      return await prisma.$transaction(async (tx) => {
        const twoFactor = await tx.twoFactor.findUnique({
          where: {
            id: twoFactorId,
          },
          select: {
            userId: true,
          },
        });
        if (!twoFactor) return null;

        return await tx.user.findUnique({
          where: {
            id: twoFactor.userId,
          },
          select: {
            id: true,
            email: true,
          },
        });
      });
    })();
    if (!user) {
      return {
        error: 'User does not exist',
      };
    }

    const sendEmailRateLimit = await ratelimit.sendEmail.limit(user.email);
    if (!sendEmailRateLimit.success) {
      return {
        error: 'Too many requests, please try again later',
      };
    }

    const { id, code } = await upsertTwoFactor(user.id);

    await createTwoFactorCookie(id);

    await sendTwoFactorEmail(user.email, code);

    return {};
  } catch (error) {
    console.error(error);

    return {
      error: 'Something went wrong!',
    };
  }
}
