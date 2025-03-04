import { OtpType } from '@prisma/client';
import { z } from 'zod';

const signInSchema = z.object({
  body: z.object({
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
  }),
});

const signUpSchema = z.object({
  body: z.object({
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
  }),
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: 'Email is required',
      })
      .email({
        message: 'Invalid email',
      }),
    type: z.enum([OtpType.email_verification, OtpType.password_reset], {
      message: 'Invalid type',
    }),
  }),
});

const verifyAccountSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: 'Email is required',
      })
      .email({
        message: 'Invalid email',
      }),
    code: z
      .string({
        message: 'Code is required',
      })
      .length(6, {
        message: 'Code must be 6 characters',
      }),
  }),
});

const ResetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({
        message: 'New password is required',
      })
      .min(8, {
        message: 'Password must be at least 8 characters',
      }),
  }),
});

export const AuthValidation = {
  signInSchema,
  signUpSchema,
  sendOtpSchema,
  verifyAccountSchema,
  ResetPasswordSchema,
};
