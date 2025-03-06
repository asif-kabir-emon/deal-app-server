"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const signInSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            message: 'Email is required',
        })
            .email({
            message: 'Invalid email',
        }),
        password: zod_1.z
            .string({
            message: 'Password is required',
        })
            .min(8, {
            message: 'Password must be at least 8 characters',
        }),
    }),
});
const signUpSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z
            .string({
            message: 'First name is required',
        })
            .min(3, {
            message: 'First name must be at least 3 characters',
        }),
        lastName: zod_1.z
            .string({
            message: 'Last name is required',
        })
            .min(3, {
            message: 'Last name must be at least 3 characters',
        }),
        email: zod_1.z
            .string({
            message: 'Email is required',
        })
            .email({
            message: 'Invalid email',
        }),
        password: zod_1.z
            .string({
            message: 'Password is required',
        })
            .min(8, {
            message: 'Password must be at least 8 characters',
        }),
    }),
});
const sendOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            message: 'Email is required',
        })
            .email({
            message: 'Invalid email',
        }),
        type: zod_1.z.enum([client_1.OtpType.email_verification, client_1.OtpType.password_reset], {
            message: 'Invalid type',
        }),
    }),
});
const verifyAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            message: 'Email is required',
        })
            .email({
            message: 'Invalid email',
        }),
        code: zod_1.z
            .string({
            message: 'Code is required',
        })
            .length(6, {
            message: 'Code must be 6 characters',
        }),
    }),
});
const ResetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z
            .string({
            message: 'New password is required',
        })
            .min(8, {
            message: 'Password must be at least 8 characters',
        }),
    }),
});
const OAuthSignInSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            message: 'Email is required.',
        })
            .email({
            message: 'Invalid email!',
        }),
        firstName: zod_1.z
            .string({
            message: 'First name is required.',
        })
            .min(1, {
            message: 'First name must be at least 1 characters.',
        }),
        lastName: zod_1.z
            .string({
            message: 'Last name is required.',
        })
            .min(1, {
            message: 'Last name must be at least 1 characters.',
        }),
        provider: zod_1.z.enum([client_1.OAuthProvider.google, client_1.OAuthProvider.github], {
            message: 'Invalid provider.',
        }),
        providerId: zod_1.z
            .string({
            message: 'Provider ID is required.',
        })
            .min(2, {
            message: 'Provider ID must be at least 2 characters.',
        }),
    }),
});
exports.AuthValidation = {
    signInSchema,
    signUpSchema,
    sendOtpSchema,
    verifyAccountSchema,
    ResetPasswordSchema,
    OAuthSignInSchema,
};
