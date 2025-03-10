'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { createSalt, hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import {
  signInSchema,
  signUpSchema,
  SignIn,
  SignUp,
} from '@/lib/auth/definitions';

export async function signIn(credentials: SignIn) {
  const { success, data } = signInSchema.safeParse(credentials);

  if (!success) {
    return {
      status: 'error',
      message: 'Invalid credentials',
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

  if (!user) {
    return {
      status: 'error',
      message: 'Account does not exists',
    };
  }

  const isPasswordValid = await verifyPassword({
    password: data.password,
    hashedPassword: user.password,
    salt: user.salt,
  });

  if (!isPasswordValid) {
    return {
      status: 'error',
      message: 'Invalid password',
    };
  }

  await createSession(user);

  redirect('/dashboard');
}

export async function signUp(credentials: SignUp) {
  const { success, data } = signUpSchema.safeParse(credentials);

  if (!success) {
    return {
      status: 'error',
      message: 'Invalid credentials',
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    return {
      status: 'error',
      message: 'Account already exists',
    };
  }

  const salt = createSalt();
  const hashedPassword = await hashPassword(data.password, salt);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      salt,
    },
    select: {
      id: true,
      role: true,
    },
  });

  await createSession(user);

  redirect('/dashboard');
}

export async function signOut() {
  await deleteSession();
  redirect('/');
}
