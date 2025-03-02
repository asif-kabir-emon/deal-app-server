import { SendOtpPayload, SignInPayload, SignUpPayload } from './auth.interface';

const singInUser = async (payload: SignInPayload) => {};

const signUpUser = async (payload: SignUpPayload) => {};

const sendOtp = async (payload: SendOtpPayload) => {};

const resetPassword = async (payload: SendOtpPayload) => {};

const verifyOtp = async (payload: SendOtpPayload) => {};

export const AuthService = {
  singInUser,
  signUpUser,
  sendOtp,
  resetPassword,
  verifyOtp,
};
