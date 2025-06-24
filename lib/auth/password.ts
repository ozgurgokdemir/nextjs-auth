import crypto from 'crypto';
import { generateToken, TOKEN_SIZE_SHORT } from '@/lib/security/token';

type VerifyPasswordProps = {
  password: string;
  hashedPassword: string;
  salt: string;
};

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);
      resolve(hash.toString('hex').normalize());
    });
  });
}

export async function verifyPassword({
  password,
  hashedPassword,
  salt,
}: VerifyPasswordProps) {
  return crypto.timingSafeEqual(
    Buffer.from(hashedPassword),
    Buffer.from(await hashPassword(password, salt))
  );
}

export function createSalt() {
  return generateToken(TOKEN_SIZE_SHORT);
}
