import { z } from 'zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be at most 255 characters long' })
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(256, { message: 'Password must be at most 256 characters long' });

export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(50, { message: 'Name must be at most 50 characters long' });

export const tokenSchema = z
  .string()
  .max(128, { message: 'Token must be at most 128 characters long' });

export const otpSchema = z
  .string()
  .length(6, { message: 'Code must be exactly 6 characters long' })
  .regex(/^\d+$/, { message: 'Code must contain only digits' });

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const emailVerificationSchema = z.object({
  email: emailSchema,
  code: otpSchema,
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
  token: tokenSchema,
});

export type SignIn = z.infer<typeof signInSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
