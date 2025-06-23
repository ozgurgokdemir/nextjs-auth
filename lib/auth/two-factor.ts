import 'server-only';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { resend } from '@/lib/resend';

export const TWO_FACTOR_COOKIE_KEY = 'two_factor_id';
export const TWO_FACTOR_EXPIRATION_SECONDS = 60 * 15;

export async function upsertTwoFactor(userId: string) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + TWO_FACTOR_EXPIRATION_SECONDS * 1000);

  const twoFactor = await prisma.twoFactor.upsert({
    where: {
      userId,
    },
    update: {
      code,
      expiresAt,
    },
    create: {
      userId,
      code,
      expiresAt,
    },
  });

  return twoFactor;
}

export async function getTwoFactor(id: string) {
  const twoFactor = await prisma.twoFactor.findUnique({
    where: {
      id,
    },
  });

  return twoFactor;
}

export async function deleteTwoFactor(id: string) {
  await prisma.twoFactor.delete({
    where: {
      id,
    },
  });
}

export async function createTwoFactorCookie(id: string) {
  const cookieStore = await cookies();

  cookieStore.set(TWO_FACTOR_COOKIE_KEY, id, {
    path: '/',
    expires: new Date(Date.now() + TWO_FACTOR_EXPIRATION_SECONDS * 1000),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function getTwoFactorIdFromCookie() {
  const cookieStore = await cookies();

  const twoFactorId = cookieStore.get(TWO_FACTOR_COOKIE_KEY)?.value;

  return twoFactorId;
}

export async function deleteTwoFactorCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(TWO_FACTOR_COOKIE_KEY);
}

export async function sendTwoFactorEmail(email: string, code: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Two-factor authentication',
    html: `<p>Your verification code: <b>${code}</b></p>`,
  });
}
