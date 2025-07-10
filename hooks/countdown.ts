import * as React from 'react';

const COUNTDOWN_SECONDS = 30;

function calculateCountdown(reset: number) {
  return Math.max(0, Math.floor((reset - Date.now()) / 1000));
}
function getCountdownFromStorage(key: string) {
  const storedCountdown = sessionStorage.getItem(key);
  if (!storedCountdown) return 0;
  const countdown = Number(JSON.parse(storedCountdown));
  if (typeof countdown !== 'number' || isNaN(countdown)) return 0;
  return calculateCountdown(countdown);
}
function setCountdownToStorage(key: string, reset: number) {
  sessionStorage.setItem(key, JSON.stringify(reset));
}
function removeCountdownFromStorage(key: string) {
  sessionStorage.removeItem(key);
}

export function useCountdown(key: string) {
  const storageKey = `countdown:${key}`;

  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    const countdown = getCountdownFromStorage(storageKey);
    setCountdown(countdown);
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((current) => current - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function startCountdown(seconds = COUNTDOWN_SECONDS) {
    const reset = Date.now() + seconds * 1000;
    setCountdownToStorage(storageKey, reset);
    const countdown = calculateCountdown(reset);
    setCountdown(countdown);
  }

  function resetCountdown() {
    setCountdown(0);
    removeCountdownFromStorage(storageKey);
  }

  return {
    countdown,
    startCountdown,
    resetCountdown,
  };
}
