import { z } from 'zod';

const signInSchema = z.object({
  email: z
    .string({
      message: 'Email is required',
    })
    .email({
      message: 'Invalid email',
    }),
  password: z
    .string({
      message: 'Password is required',
    })
    .min(8, {
      message: 'Password must be at least 8 characters',
    }),
});

const signUpSchema = z.object({
  firstName: z
    .string({
      message: 'First name is required',
    })
    .min(3, {
      message: 'First name must be at least 3 characters',
    }),
  lastName: z
    .string({
      message: 'Last name is required',
    })
    .min(3, {
      message: 'Last name must be at least 3 characters',
    }),
  email: z
    .string({
      message: 'Email is required',
    })
    .email({
      message: 'Invalid email',
    }),
  password: z
    .string({
      message: 'Password is required',
    })
    .min(8, {
      message: 'Password must be at least 8 characters',
    }),
});

export const AuthValidation = {
  signInSchema,
  signUpSchema,
};
