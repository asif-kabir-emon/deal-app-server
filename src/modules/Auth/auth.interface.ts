import { OAuthProvider, OtpType } from '@prisma/client';

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SendOtpPayload {
  email: string;
  type: OtpType;
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
  token: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  code: string;
  email: string;
}

export interface OAuthSignInPayload {
  email: string;
  firstName: string;
  lastName: string;
  provider: OAuthProvider;
  providerId: string;
}
