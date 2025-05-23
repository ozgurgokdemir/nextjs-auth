import 'server-only';

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { resend } from '@/lib/resend';

const VERIFICATION_CODE_EXPIRATION_SECONDS = 60 * 60 * 24;

export async function upsertDeleteAccount(userId: string) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_CODE_EXPIRATION_SECONDS * 1000
  );

  return await prisma.deleteAccount.upsert({
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
}

export async function sendDeleteAccountEmail(email: string, code: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Delete your account',
    html: `<p>Your verification code to delete your account: <b>${code}</b></p>`,
  });
}
