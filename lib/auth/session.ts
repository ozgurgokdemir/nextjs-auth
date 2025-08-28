import 'server-only';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { redis } from '@/lib/db/redis';
import { generateToken } from '@/lib/auth/token';
import { getExpiresAt } from '@/lib/date';

const SESSION_COOKIE_KEY = 'session_id';
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  isTwoFactorVerified: z.boolean().optional(),
  twoFactorExpiresAt: z.coerce.date().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

export async function createSession(user: Session) {
  const { success, data } = sessionSchema.safeParse(user);
  if (!success) {
    return {
      success: false,
    };
  }

  const sessionId = generateToken();

  const response = await redis
    .multi()
    .setex(`session:${sessionId}`, SESSION_EXPIRATION_SECONDS, data)
    .sadd(`user:${data.id}:sessions`, sessionId)
    .expire(`user:${data.id}:sessions`, SESSION_EXPIRATION_SECONDS)
    .exec();
  if (response[0] !== 'OK') {
    return {
      success: false,
    };
  }

  await createSessionIdCookie(sessionId);

  return {
    success: true,
    sessionId,
  };
}

export async function getSession() {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return;
  }

  const session = await redis.get(`session:${sessionId}`);
  const { success, data } = sessionSchema.safeParse(session);
  if (!success) {
    deleteSessionIdCookie();
    return;
  }

  return {
    ...data,
    sessionId,
  };
}

export async function updateSession(user: Session) {
  const { success, data } = sessionSchema.safeParse(user);
  if (!success) {
    return {
      success: false,
    };
  }

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return {
      success: false,
    };
  }

  const response = await redis
    .multi()
    .setex(`session:${sessionId}`, SESSION_EXPIRATION_SECONDS, data)
    .expire(`user:${data.id}:sessions`, SESSION_EXPIRATION_SECONDS)
    .exec();
  if (response[0] !== 'OK') {
    return {
      success: false,
    };
  }

  await createSessionIdCookie(sessionId);

  return {
    success: true,
    sessionId,
  };
}

export async function deleteSession() {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return {
      success: false,
    };
  }

  const session = await redis.get(`session:${sessionId}`);
  const { success, data } = sessionSchema.safeParse(session);
  if (!success) {
    return {
      success: false,
    };
  }

  const response = await redis
    .multi()
    .del(`session:${sessionId}`)
    .srem(`user:${data.id}:sessions`, sessionId)
    .exec();
  if (response[0] !== 1) {
    return {
      success: false,
    };
  }

  await deleteSessionIdCookie();

  return {
    success: true,
  };
}

export async function invalidateSessions(
  userId: string,
  excludeSessionId?: string
) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);

  const sessionsToDelete = sessionIds.filter((id) => id !== excludeSessionId);
  if (sessionsToDelete.length === 0) {
    return {
      success: true,
    };
  }

  const sessionKeys = sessionsToDelete.map((id) => `session:${id}`);

  const response = await redis
    .multi()
    .del(...sessionKeys)
    .srem(`user:${userId}:sessions`, ...sessionsToDelete)
    .exec();

  return {
    success: response[0] === 1,
  };
}

async function createSessionIdCookie(sessionId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
    path: '/',
    expires: getExpiresAt(SESSION_EXPIRATION_SECONDS),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });
}

async function getSessionIdFromCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_KEY)?.value;
}

async function deleteSessionIdCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_KEY);
}
