import { redis } from '@/lib/db/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const ratelimit = {
  signIn: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:sign_in',
  }),
  signUp: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    analytics: true,
    prefix: 'ratelimit:sign_up',
  }),
  emailVerification: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:email_verification',
  }),
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    analytics: true,
    prefix: 'ratelimit:password_reset',
  }),
  twoFactor: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:two_factor',
  }),
  sendEmail: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    analytics: true,
    prefix: 'ratelimit:send_email',
  }),
};
