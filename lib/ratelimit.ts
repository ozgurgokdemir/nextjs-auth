import { redis } from '@/lib/db/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const ratelimit = {
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: 'ratelimit:global',
  }),
};
