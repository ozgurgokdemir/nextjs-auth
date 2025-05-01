'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { createSalt, hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import {
  signInSchema,
  SignIn,
  signUpSchema,
  SignUp,
  emailVerificationSchema,
  EmailVerification,
  emailSchema,
} from '@/lib/auth/definitions';
import { getOAuthClient, Provider } from '@/lib/auth/oauth';
import {
  upsertPendingUser,
  sendEmailVerification,
  setVerificationEmailCookie,
  deleteVerificationEmailCookie,
  updateVerificationCode,
} from '@/lib/auth/email-verification';

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
      role: true,
    },
  });
  if (!user || !user.password || !user.salt) {
    return {
      error: 'User does not exists',
    };
  }

  const isPasswordValid = await verifyPassword({
    password: data.password,
    hashedPassword: user.password,
    salt: user.salt,
  });
  if (isPasswordValid) {
    return {
      error: 'Password is incorrect',
    };
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

export async function verifyEmail(credentials: EmailVerification) {
  const { success, data } = emailVerificationSchema.safeParse(credentials);
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

  if (pendingUser.expiresAt < new Date()) {
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
      email: credentials.email,
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
