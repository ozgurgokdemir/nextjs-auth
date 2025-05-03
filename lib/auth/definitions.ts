import { z } from 'zod';

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
  .min(2, { message: 'Name must be at least 2 characters long' });

export const codeSchema = z
  .string()
  .length(6, { message: 'Code must be 6 characters long' });

export const tokenSchema = z
  .string()
  .length(64, { message: 'Token must be 64 characters long' });

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
  code: codeSchema,
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
  token: tokenSchema,
});

export type SignIn = z.infer<typeof signInSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
