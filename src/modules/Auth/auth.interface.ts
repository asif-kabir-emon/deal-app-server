import { OtpType } from '@prisma/client';

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
