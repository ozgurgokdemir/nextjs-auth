import 'server-only';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { resend } from '@/lib/resend';
import { generateOTP } from '@/lib/auth/token';
import { getExpiresAt } from '@/lib/date';

const VERIFICATION_CODE_EXPIRATION_SECONDS = 60 * 60 * 24;
const VERIFICATION_EMAIL_COOKIE_KEY = 'verification_email';
const VERIFICATION_EMAIL_EXPIRATION_SECONDS = 60 * 15;

type PendingUser = {
  email: string;
  name: string;
  password: string;
  salt: string;
};

export async function upsertPendingUser({
  email,
  name,
  password,
  salt,
}: PendingUser) {
  const code = generateOTP();
  const expiresAt = getExpiresAt(VERIFICATION_CODE_EXPIRATION_SECONDS);

  return await prisma.pendingUser.upsert({
    where: {
      email,
    },
    update: {
      name,
      password,
      salt,
      code,
      expiresAt,
    },
    create: {
      name,
      email,
      password,
      salt,
      code,
      expiresAt,
    },
  });
}

export async function updateVerificationCode(email: string) {
  return await prisma.pendingUser.update({
    where: {
      email,
    },
    data: {
      code: generateOTP(),
      expiresAt: getExpiresAt(VERIFICATION_CODE_EXPIRATION_SECONDS),
    },
    select: {
      email: true,
      code: true,
    },
  });
}

export async function sendEmailVerification(email: string, code: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Verify your email address',
    html: `<p>Your verification code: <b>${code}</b></p>`,
  });
}

export async function getVerificationEmailFromCookie() {
  const cookieStore = await cookies();
  const email = cookieStore.get(VERIFICATION_EMAIL_COOKIE_KEY)?.value;
  return email;
}

export async function setVerificationEmailCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(VERIFICATION_EMAIL_COOKIE_KEY, email, {
    path: '/',
    expires: getExpiresAt(VERIFICATION_EMAIL_EXPIRATION_SECONDS),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function deleteVerificationEmailCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(VERIFICATION_EMAIL_COOKIE_KEY);
}
