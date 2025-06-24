import 'server-only';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redis } from '@/lib/db/redis';
import { generateToken } from '@/lib/security/token';
import { getExpiresAt } from '@/lib/security/time';

const SESSION_COOKIE_KEY = 'session_id';
const SESSION_REDIS_KEY = 'session';
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  isTwoFactorVerified: z.boolean().optional(),
  twoFactorExpiresAt: z.coerce.date().optional(),
});

export async function createSession(user: z.infer<typeof sessionSchema>) {
  const { success, data } = sessionSchema.safeParse(user);
  if (!success) return;

  const sessionId = generateToken();

  await redis.set(`${SESSION_REDIS_KEY}:${sessionId}`, data, {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
    path: '/',
    expires: getExpiresAt(SESSION_EXPIRATION_SECONDS),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function getSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
  if (!sessionId) return;

  const session = await redis.get(`${SESSION_REDIS_KEY}:${sessionId}`);

  const { data } = sessionSchema.safeParse(session);

  return data;
}

export async function updateSession(user: z.infer<typeof sessionSchema>) {
  const { success, data } = sessionSchema.safeParse(user);
  if (!success) return;

  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
  if (!sessionId) return;

  await redis.set(`${SESSION_REDIS_KEY}:${sessionId}`, data, {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
    path: '/',
    expires: getExpiresAt(SESSION_EXPIRATION_SECONDS),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
  if (!sessionId) return;

  await redis.del(`${SESSION_REDIS_KEY}:${sessionId}`);

  cookieStore.delete(SESSION_COOKIE_KEY);
}
