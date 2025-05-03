import 'server-only';

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { resend } from '@/lib/resend';

const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;

export async function upsertPasswordReset(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_SECONDS * 1000);

  const existingPasswordReset = await prisma.passwordReset.findFirst({
    where: {
      email,
    },
  });
  if (existingPasswordReset) {
    return await prisma.passwordReset.update({
      where: {
        id: existingPasswordReset.id,
      },
      data: {
        token,
        expiresAt,
      },
    });
  }

  return await prisma.passwordReset.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `http://localhost:3000/password-reset/${token}`;
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your password',
    html: `Click the link to reset your password: ${url}`,
  });
}
