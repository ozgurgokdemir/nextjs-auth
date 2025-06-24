import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { resend } from '@/lib/resend';
import { generateToken } from '@/lib/security/token';
import { getExpiresAt } from '@/lib/security/time';

const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;

export async function upsertPasswordReset(email: string) {
  const token = generateToken();
  const expiresAt = getExpiresAt(TOKEN_EXPIRATION_SECONDS);

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
