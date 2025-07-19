import * as React from 'react';
import { z } from 'zod';

const DEFAULT_DURATION_SECONDS = 30;

interface CountdownOptions {
  key: string;
  duration?: number;
}

export function useCountdown({
  key,
  duration = DEFAULT_DURATION_SECONDS,
}: CountdownOptions) {
  const storageKey = `countdown:${key}`;

  const [time, setTime] = React.useState(duration);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning || time <= 0) return;

    const timer = setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          setIsRunning(false);
          clearStorage(storageKey);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [time, isRunning]);

  function start() {
    const storedTime = getStoredTime(storageKey);
    if (storedTime > 0) {
      setTime(storedTime);
    } else {
      setTime(duration);
      saveToStorage(storageKey, duration);
    }
    setIsRunning(true);
  }

  function reset() {
    setTime(duration);
    setIsRunning(false);
    clearStorage(storageKey);
  }

  return {
    time,
    isRunning,
    isComplete: time === 0,
    start,
    reset,
  };
}

function getStoredTime(key: string) {
  const stored = sessionStorage.getItem(key);
  if (!stored) return 0;

  const parsed = z.coerce.number().safeParse(JSON.parse(stored));
  if (!parsed.success) return 0;

  const remaining = Math.floor((parsed.data - Date.now()) / 1000);
  return Math.max(0, remaining);
}

function saveToStorage(key: string, time: number) {
  const endsAt = Date.now() + time * 1000;
  sessionStorage.setItem(key, JSON.stringify(endsAt));
}

function clearStorage(key: string) {
  sessionStorage.removeItem(key);
}
