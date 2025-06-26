import crypto from 'crypto';

export const TOKEN_SIZE_SHORT = 16;
export const TOKEN_SIZE_STRONG = 32;

export function generateToken(size = TOKEN_SIZE_STRONG) {
  return crypto.randomBytes(size).toString('hex');
}

export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}
