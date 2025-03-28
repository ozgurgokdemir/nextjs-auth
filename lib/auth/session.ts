import 'server-only';

import crypto from 'crypto';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redis } from '@/lib/db/redis';

const SESSION_COOKIE_KEY = 'session-id';
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(['USER', 'ADMIN']),
});

export async function createSession(user: z.infer<typeof sessionSchema>) {
  const sessionId = crypto.randomBytes(512).toString('hex').normalize();

  await redis.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
    path: '/',
    expires: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function getSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;

  if (!sessionId) return;

  const session = await redis.get(`session:${sessionId}`);

  const { data } = sessionSchema.safeParse(session);

  return data;
}

export async function updateSession(user: z.infer<typeof sessionSchema>) {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;

  if (!sessionId) return;

  await redis.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
    path: '/',
    expires: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;

  if (!sessionId) return;

  await redis.del(`session:${sessionId}`);

  cookieStore.delete(SESSION_COOKIE_KEY);
}
