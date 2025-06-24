export function getExpiresAt(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

export function isExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}
